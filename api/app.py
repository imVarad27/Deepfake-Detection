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
from moviepy.editor import VideoFileClip
from fastapi import Request



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


from fastapi import FastAPI, UploadFile, File, HTTPException
import torch
from torchvision import transforms, models
import os
import numpy as np
import cv2
import face_recognition
from torch import nn
from PIL import Image as pImage
import time
import glob
import shutil



im_size = 112
mean = [0.485, 0.456, 0.406]
std = [0.229, 0.224, 0.225]
sm = nn.Softmax()
inv_normalize = transforms.Normalize(mean=-1 * np.divide(mean, std), std=np.divide([1, 1, 1], std))

train_transforms = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((im_size, im_size)),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)])

class Model(nn.Module):
    def __init__(self, num_classes, latent_dim=2048, lstm_layers=1, hidden_dim=2048, bidirectional=False):
        super(Model, self).__init__()
        model = models.resnext50_32x4d(pretrained=True)
        self.model = nn.Sequential(*list(model.children())[:-2])
        self.lstm = nn.LSTM(latent_dim, hidden_dim, lstm_layers, bidirectional)
        self.dp = nn.Dropout(0.4)
        self.linear1 = nn.Linear(2048, num_classes)
        self.avgpool = nn.AdaptiveAvgPool2d(1)

    def forward(self, x):
        batch_size, seq_length, c, h, w = x.shape
        x = x.view(batch_size * seq_length, c, h, w)
        fmap = self.model(x)
        x = self.avgpool(fmap)
        x = x.view(batch_size, seq_length, 2048)
        x_lstm, _ = self.lstm(x, None)
        return fmap, self.dp(self.linear1(x_lstm[:, -1, :]))
def detect_faces_in_video(video_path):
    vidObj = cv2.VideoCapture(video_path)
    success = 1
    face_detected = False
    
    while success:
        success, frame = vidObj.read()
        if success:
            # Detect face locations in the frame
            face_locations = face_recognition.face_locations(frame)
            if face_locations:
                face_detected = True
                break
    
    return face_detected


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
            try:
                top, right, bottom, left = faces[0]
                frame = frame[top:bottom, left:right, :]
            except:
                pass
            frames.append(self.transform(frame))
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

def predict(model, img, video_file_name):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    fmap, logits = model(img.to(device))
    params = list(model.parameters())
    weight_softmax = model.linear1.weight.detach().cpu().numpy()
    logits = sm(logits)
    _, prediction = torch.max(logits, 1)
    confidence = logits[:, int(prediction.item())].item() * 100
    print('confidence of prediction:', logits[:, int(prediction.item())].item() * 100)
    return [int(prediction.item()), confidence]

def allowed_video_file(filename):
    ALLOWED_VIDEO_EXTENSIONS = set(['mp4', 'gif', 'webm', 'avi', '3gp', 'wmv', 'flv', 'mkv'])
    return filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

@app.post("/upload_video/")
async def upload_video_file(request: Request):
    form_data = await request.form()
    file = form_data['file']
    sequence_length = 10
    #face_locations = face_recognition.face_locations(file)
    
    if not allowed_video_file(file.filename):
        raise HTTPException(status_code=400, detail="Only video files are allowed")
    
    saved_video_file = f"uploaded_file_{int(time.time())}.{file.filename.split('.')[-1]}"
    with open(saved_video_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    #face_detected = detect_faces_in_video(saved_video_file)

    #if not face_detected:
     #   return {"error": "No face detected in the video"}
    
    video_dataset = ValidationDataset([saved_video_file], sequence_length=sequence_length, transform=train_transforms)
    model = Model(2)
    model_name = get_accurate_model(sequence_length)
    path_to_model = os.path.join("models", model_name)
    model.load_state_dict(torch.load(path_to_model, map_location=torch.device('cpu')))
    model.eval()
    
    predictions = []
    for i in range(len(video_dataset)):
        predictions.append(predict(model, video_dataset[i], saved_video_file))
    
    return {"predictions": predictions}

def get_accurate_model(sequence_length):
    model_name = []
    sequence_model = []
    final_model = ""
    list_models = glob.glob(os.path.join("models", "*.pt"))
    for i in list_models:
        model_name.append(os.path.basename(i))
    for i in model_name:
        try:
            seq = i.split("_")[3]
            if int(seq) == sequence_length:
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
  
    
model = tf.keras.models.load_model('D:\\Deepfake-Detection\\models\\Deepfake86.h5')

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
async def predict_image(request: Request):
    form_data = await request.form()
    image_file = form_data['file']
    # Check if the uploaded file is an image
    
    
    # Read image file
    contents = await image_file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    face_locations = face_recognition.face_locations(image)
    
    if not face_locations:
        return {"error": "No face detected in the image"}

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
