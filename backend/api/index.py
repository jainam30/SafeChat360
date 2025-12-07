import sys
import os

# Add the parent directory (backend) to sys.path to allow importing 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Vercel needs "app" to be available at module level
