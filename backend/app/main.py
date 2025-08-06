
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import moderation

app = FastAPI(
    title="SafeChat360 API",
    description="Multimodal Content Moderation API using HuggingFace models",
    version="1.0.0"
)

# Allow frontend to access backend (CORS settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the moderation route
app.include_router(moderation.router, prefix="/api")
