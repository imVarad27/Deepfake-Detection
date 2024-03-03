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

if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='localhost', port=8000)