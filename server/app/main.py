from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    print("hello world") 
    return {"message": "Hello World"}
