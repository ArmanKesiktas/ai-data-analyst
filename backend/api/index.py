from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the main app
from main import app

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Will be configured via environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mangum handler for AWS Lambda / Vercel
handler = Mangum(app, lifespan="off")
