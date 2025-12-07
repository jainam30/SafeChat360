from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, moderation, history, social, users, video, analytics, review, blocklist
import uvicorn
import os

app = FastAPI(title="SafeChat360 Backend")

# CORS setup
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "*" # For development, fine to allow all
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(moderation.router)
app.include_router(history.router)
app.include_router(social.router)
app.include_router(users.router)
app.include_router(video.router)
app.include_router(review.router)
app.include_router(analytics.router)
app.include_router(blocklist.router)

@app.get("/")
def read_root():
    return {"message": "SafeChat360 Backend is running"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
