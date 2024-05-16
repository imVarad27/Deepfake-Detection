from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import random
import smtplib
import ssl
import string
from sqlalchemy import create_engine, MetaData, Table, select,insert
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from sqlalchemy import and_
from pydantic import BaseModel




DATABASE_URL = "mysql+mysqlconnector://root:Dkte*123@localhost/deepfake"
engine = create_engine(DATABASE_URL)
metadata = MetaData()
users = Table("user", metadata, autoload_with=engine)

origins = [
    "http://localhost",
    "http://localhost:3000",  # Add your frontend URL here
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587  
SMTP_USERNAME = 'rohitshetti132@gmail.com'
SMTP_PASSWORD = 'qwqe maes hqaw qvtr'
SENDER_EMAIL = 'rohitshetti132@gmail.com'

import secrets

# def generate_password():
#     length = 10
#     lower = string.ascii_lowercase
#     upper = string.ascii_uppercase
#     digits = string.digits
#     special = '!@#$%^&*'
    
#     # Ensure the password contains at least one character from each category
#     password = (
#         random.choice(lower) +
#         random.choice(upper) +
#         random.choice(digits) +
#         random.choice(special) +
#         ''.join(random.choices(lower + upper + digits + special, k=length-4))
#     )
    
#     # Shuffle the characters to make the password more random
#     password = ''.join(random.sample(password, len(password)))
    
#     return password

def generate_otp(length=4):
    if length <= 0:
        raise ValueError("Length must be greater than zero.")
    
    num_bytes = (length * 6 + 7) // 8
    random_number = secrets.randbits(num_bytes * 8)
    
    otp = ''.join(str((random_number >> i) & 0x3F) for i in range(0, length * 6, 6))
    
    return otp.zfill(length)

def send_email(receiver_email, otp):
    message = MIMEMultipart()
    message['From'] = SENDER_EMAIL
    message['To'] = receiver_email
    message['Subject'] = 'Your OTP for Password Reset'
    
    body = f'Your OTP is: {otp}'
    message.attach(MIMEText(body, 'plain'))

    context = ssl.create_default_context()
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.ehlo()  # Can be omitted
        server.starttls(context=context)
        server.ehlo()  # Can be omitted
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SENDER_EMAIL, receiver_email, message.as_string())
        

class User(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    mobile: str

@app.get("/users/{user_id}")
async def read_user(user_id: int):
    query = select([users]).where(users.columns.user_id == user_id)
    with engine.connect() as connection:
        result = connection.execute(query)
        user = result.fetchone()
    return {**user}
@app.post("/register")
async def create_user(user: User):
    # Check if email already exists
    with engine.connect() as connection:
        email_query = select([users]).where(users.columns.email == user.email)
        email_result = connection.execute(email_query)
        existing_user =  email_result.fetchone()

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists.")

        query = insert(users).values(first_name=user.first_name, last_name=user.last_name, mobile=user.mobile, email=user.email,password=user.password)

    with engine.connect() as connection:
        try:
            result = connection.execute(query)
        except:
            raise HTTPException(status_code=400, detail="User creation failed.")
        if result.rowcount:
            return {"message": "User created successfully."}
        else:
            raise HTTPException(status_code=400, detail="User creation failed.")

        
@app.post("/login")
async def  login_user(request: Request):
    login_data = await request.json()
    username = login_data.get("email")
    password = login_data.get("password")
    query = select([users]).where(and_(users.columns.email == username, users.columns.password == password))
    with engine.connect() as connection:
        result = connection.execute(query)
        user = result.fetchone()
        if result.rowcount:
            user_data = {
                "id" : user.user_id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "mobile": user.mobile,
                "email": user.email,
            }
            return {"message": "User login successfully.", "user": user_data}
        else:
            raise HTTPException(status_code=400, detail="Login failed.")
        
@app.post("/generate-otp")
async def send_otp(request: Request):
    data = await request.json()
    email = data.get("email")
    otp = generate_otp()
    query = users.select().where(users.c.email == email)
    with engine.connect() as connection:
        result = connection.execute(query)
        if result.rowcount:
            send_email(email, otp)
            
            update_query = (
                users.update()
                .values(otp=otp)
                .where(users.c.email == email)
            )
            result = connection.execute(update_query)

            return {"detail": "OTP sent successfully"}
        else:
            raise HTTPException(status_code=400, detail="Email doesn't exist")
        
@app.post("/validate-otp")
async def validate_otp(request: Request):
    data = await request.json()
    email = data.get("email")
    otp = data.get("otp")
    
    query = select([users.c.otp]).where(users.c.email == email)
    
    with engine.connect() as connection:
        result = connection.execute(query)
        user = result.fetchone()
        if user:
            stored_otp = user["otp"]
            if str(stored_otp) == str(otp):
                return {"detail": "OTP is valid"}
            else:
                raise HTTPException(status_code=400, detail="Invalid OTP")
        else:
            raise HTTPException(status_code=404, detail="Email not found")
        
@app.post("/resetpassword")
async def forgot_pass(request: Request):
    reset_data = await request.json()
    email = reset_data.get("email")
    new_password = reset_data.get("password")
    
    query = select([users]).where(users.columns.email == email)
    with engine.connect() as connection:
        result = connection.execute(query)
        user = result.fetchone()
        if user:
            update_query = (
                users.update()
                .where(users.columns.email == email)
                .values(password=new_password)
            )
            connection.execute(update_query)
            return {"message": "Password reset successfully."}
        else:
            raise HTTPException(status_code=400, detail="Email not found in the database.")

            
    
if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='localhost', port=8001)