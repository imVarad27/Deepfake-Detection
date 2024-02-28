import shutil
from fastapi import FastAPI, File, UploadFile
from io import BytesIO
import numpy as np
from PIL import Image
import torch
from torch import nn
from torchvision import models
from torchvision import transforms
import cv2

app = FastAPI()

im_size = 112
mean = [0.485, 0.456, 0.406]
std = [0.229, 0.224, 0.225]
sm = nn.Softmax()

inv_normalize = transforms.Normalize(mean=-1 * np.divide(mean, std), std=np.divide([1, 1, 1], std))


def im_convert(tensor):
    """ Display a tensor as an image. """
    image = tensor.to("cpu").clone().detach()
    image = image.squeeze()
    image = inv_normalize(image)
    image = image.numpy()
    image = image.transpose(1, 2, 0)
    image = np.clip(image, 0, 1)  # Clip values to range [0, 1]
    return image


class Model(nn.Module):
    def __init__(self, num_classes, latent_dim=2048, lstm_layers=1, hidden_dim=2048, bidirectional=False):
        super(Model, self).__init__()
        model = models.resnext50_32x4d(pretrained=True)
        self.model = nn.Sequential(*list(model.children())[:-2])
        self.bn = nn.BatchNorm2d(2048)
        self.lstm = nn.LSTM(latent_dim, hidden_dim, lstm_layers, bidirectional)
        self.dp = nn.Dropout(0.5)
        self.linear1 = nn.Linear(2048, num_classes)
        self.avgpool = nn.AdaptiveAvgPool2d(1)

    def forward(self, x):
        batch_size, seq_length, c, h, w = x.shape
        x = x.view(batch_size * seq_length, c, h, w)
        fmap = self.model(x)
        fmap = self.bn(fmap)
        x = self.avgpool(fmap)
        x = x.view(batch_size, seq_length, 2048)
        x_lstm, _ = self.lstm(x, None)
        return fmap, self.dp(self.linear1(torch.mean(x_lstm, dim=1)))


model = Model(num_classes=2)
path_to_model = 'D:\\Deepfake-Detection\\api\\model_86.pt'  # Adjust path as needed
model.load_state_dict(torch.load(path_to_model, map_location=torch.device('cpu')))
model.eval()


@app.get("/ping")
async def ping():
    return "I am alive"


def read_file_as_image(data) -> np.ndarray:
    image = np.array(Image.open(BytesIO(data)))
    return image


class ValidationDataset(torch.utils.data.Dataset):
    def __init__(self, video_names, sequence_length=60, transform=None):
        self.video_names = video_names
        self.transform = transform
        self.count = sequence_length

    def __len__(self):
        return len(self.video_names)

    def __getitem__(self,idx):
        video_path = self.video_names[idx]
        frames = []
        a = int(100/self.count)
        first_frame = np.random.randint(0,a) 
        for i,frame in enumerate(self.frame_extract(video_path)):
          frames.append(self.transform(frame))
          if(len(frames) == self.count):
            break
        frames = torch.stack(frames)
        frames = frames[:self.count]
        return frames.unsqueeze(0)

    def frame_extract(self, path):
        vidObj = cv2.VideoCapture(path)
        success = 1
        while success:
            success, image = vidObj.read()
            if success:
                yield image


async def prediction(model, img):
    fmap,logits = model(img.to('cpu'))
    params = list(model.parameters())
    weight_softmax = model.linear1.weight.detach().cpu().numpy()
    logits = sm(logits)
    _,prediction = torch.max(logits,1)
    confidence = logits[:,int(prediction.item())].item()*100
    #print('confidence of prediction:',logits[:,int(prediction.item())].item()*100)
    idx = np.argmax(logits.detach().cpu().numpy())
    bz, nc, h, w = fmap.shape
    out = np.dot(fmap[-1].detach().cpu().numpy().reshape((nc, h*w)).T,weight_softmax[idx,:].T)
    predict = out.reshape(h,w)
    predict = predict - np.min(predict)
    predict_img = predict / np.max(predict)
    predict_img = np.uint8(255*predict_img)
    out = cv2.resize(predict_img, (im_size,im_size))
    heatmap = cv2.applyColorMap(out, cv2.COLORMAP_JET)
    img = im_convert(img[:,-1,:,:,:])
    result = heatmap * 0.5 + img*0.8*255
    cv2.imwrite('/content/1.png',result)
    result1 = heatmap * 0.5/255 + img*0.8
    r,g,b = cv2.split(result1)
    result1 = cv2.merge((r,g,b))
    return [int(prediction.item()),confidence]


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Save the uploaded file to disk
        with open(file.filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Preprocess the video frames
        train_transforms = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((im_size, im_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean, std)])
        video_dataset = ValidationDataset([file.filename], sequence_length=20, transform=train_transforms)

        # Make prediction
        prediction_result = await prediction(model, video_dataset[0])
        if prediction_result[0] == 1:
            return {"prediction":"REAL",
                    "Confidance":prediction_result[1]}
        else:
            return{"Prediction":"FAKE",
                   "Confidance":prediction_result[1]}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='localhost', port=8000)
