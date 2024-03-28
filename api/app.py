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
from torch.utils.data.dataset import Dataset
import face_recognition
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import os
import glob


origins = [
    "http://localhost",
    "http://localhost:3000",  # Add your frontend URL here
]



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Model(nn.Module):
    def __init__(self, num_classes,latent_dim= 2048, lstm_layers=1 , hidden_dim = 2048, bidirectional = False):
        super(Model, self).__init__()
        model = models.resnext50_32x4d(pretrained = True) #Residual Network CNN
        self.model = nn.Sequential(*list(model.children())[:-2])
        self.lstm = nn.LSTM(latent_dim,hidden_dim, lstm_layers,  bidirectional)
        self.relu = nn.LeakyReLU()
        self.dp = nn.Dropout(0.4)
        self.linear1 = nn.Linear(2048,num_classes)
        self.avgpool = nn.AdaptiveAvgPool2d(1)
    def forward(self, x):
        batch_size,seq_length, c, h, w = x.shape
        x = x.view(batch_size * seq_length, c, h, w)
        fmap = self.model(x)
        x = self.avgpool(fmap)
        x = x.view(batch_size,seq_length,2048)
        x_lstm,_ = self.lstm(x,None)
        return fmap,self.dp(self.linear1(torch.mean(x_lstm,dim = 1)))


im_size = 112
mean = [0.485, 0.456, 0.406]
std = [0.229, 0.224, 0.225]
sm = nn.Softmax()
inv_normalize = transforms.Normalize(mean=-1 * np.divide(mean, std), std=np.divide([1, 1, 1], std))


class ValidationDataset(Dataset):
    def __init__(self, video_names, sequence_length=60, transform=None):
        self.video_names = video_names
        self.transform = transform
        self.count = sequence_length

    def __len__(self):
        return len(self.video_names)

    def __getitem__(self, idx):
        video_path = self.video_names[idx]
        frames = []
        a = int(100 / self.count)
        first_frame = np.random.randint(0, a)
        for i, frame in enumerate(self.frame_extract(video_path)):
            faces = face_recognition.face_locations(frame)
            for face_location in faces:
                top, right, bottom, left = face_location
                face_image = frame[top:bottom, left:right]
                frames.append(self.transform(face_image))
                if len(frames) == self.count:
                    break
            if len(frames) == self.count:
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


def im_convert(tensor):
    """ Display a tensor as an image. """
    image = tensor.to("cpu").clone().detach()
    image = image.squeeze()
    image = inv_normalize(image)
    image = image.numpy()
    image = image.transpose(1, 2, 0)
    image = image.clip(0, 1)
    # cv2.imwrite('./2.png',image*255)
    return image

def get_accurate_model(sequence_length):
    model_name = []
    sequence_model = []
    final_model = ""
    # Define the directory where your models are stored
    models_directory = "D:\\Deepfake-Detection\\models"
    list_models = glob.glob(os.path.join(models_directory, "*.pt"))
    for i in list_models:
        model_name.append(os.path.basename(i))
    for i in model_name:
        try:
            seq = i.split("_")[3]
            if (int(seq) == sequence_length):
                sequence_model.append(i)
        except:
            pass

    if len(sequence_model) > 1:
        accuracy = []
        for i in sequence_model:
            acc = i.split("_")[1]
            accuracy.append(acc)
        max_index = accuracy.index(max(accuracy))
        final_model = sequence_model[max_index]
    else:
        final_model = sequence_model[0]
    return final_model

def get_sequence_length(video_path):
    # Open the video file
    video_capture = cv2.VideoCapture(video_path)
    
    # Initialize frame count
    frame_count = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Release the video capture object
    video_capture.release()
    
    # Return the number of frames as the sequence length
    return frame_count


async def prediction1(model, img, path='D:\\Deepfake-Detection\\api\\model_86.pt'):
    fmap, logits = model(img.to('cpu'))
    params = list(model.parameters())
    weight_softmax = model.linear1.weight.detach().cpu().numpy()
    logits = sm(logits)
    _, prediction = torch.max(logits, 1)
    confidence = logits[:, int(prediction.item())].item() * 100
    print('confidence of prediction:', logits[:, int(prediction.item())].item() * 100)
    idx = np.argmax(logits.detach().cpu().numpy())
    bz, nc, h, w = fmap.shape
    out = np.dot(fmap[-1].detach().cpu().numpy().reshape((nc, h * w)).T, weight_softmax[idx, :].T)
    predict = out.reshape(h, w)
    predict = predict - np.min(predict)
    predict_img = predict / np.max(predict)
    predict_img = np.uint8(255 * predict_img)
    out = cv2.resize(predict_img, (im_size, im_size))
    heatmap = cv2.applyColorMap(out, cv2.COLORMAP_JET)
    img = im_convert(img[:, -1, :, :, :])
    result = heatmap * 0.5 + img * 0.8 * 255
    # cv2.imwrite('/content/1.png',result)
    result1 = heatmap * 0.5 / 255 + img * 0.8
    r, g, b = cv2.split(result1)
    result1 = cv2.merge((r, g, b))
    return [int(prediction.item()), confidence]


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Save the uploaded file to disk
        upload_dir = "D:\\Deepfake-Detection\\Data\\Video"

        # Create the directory if it doesn't exist
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        # Save the uploaded video file to a temporary location on the server
        file_path = os.path.join(upload_dir, file.filename)
        with open(file.filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Preprocess the video frames
        
        sequence_length = get_sequence_length(file.filename)
        train_transforms = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((im_size, im_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean, std)])
        video_dataset = ValidationDataset([file.filename], sequence_length=sequence_length, transform=train_transforms)
        model = Model(2)
        final_model = get_accurate_model(sequence_length)
        print(f"Using model: {final_model}")
        models_directory="D:\\Deepfake-Detection\\models"
        model_path = os.path.join(models_directory, final_model)
        model = torch.load(model_path,map_location=torch.device("cpu"))
        model.eval()
        # Make prediction
        prediction = await prediction1(model, video_dataset[0], './')
        print(prediction[0])
        if prediction[0] == 1:
            return {"prediction": "REAL", "Confidence": prediction[1]}
        else:
            return {"prediction": "FAKE", "Confidence": prediction[1]}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}
    
    
model = tf.keras.models.load_model('D:\\Deepfake-Detection\\api\\model_88.keras')

# Function for image preprocessing
def preprocess_image(image):
    # Resize the image to the input size expected by the model
    input_size = (224, 224)  # Adjust based on your model's input size
    image = cv2.resize(image, input_size)

    # Normalize pixel values to be between 0 and 1
    image = image / 255.0

    # Expand dimensions to match the input shape expected by the model
    image = np.expand_dims(image, axis=0)

    return image

@app.post("/predict_image")
async def predict_image(image_file: UploadFile = File(...)):
    # Check if the uploaded file is an image
    

    # Read image file
    contents = await image_file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Preprocess the image
    processed_image = preprocess_image(image)

    # Make predictions
    predictions = model.predict(processed_image)

    # Get the predicted label directly
    predicted_label = "Fake" if predictions[0, 0] > 0.5 else "Real"
    
    return {
        "prediction": predicted_label,
        "predicted_probability_fake": float(predictions[0, 0]),
        "predicted_probability_real": float(1 - predictions[0, 0])
    }


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='localhost', port=8000)
