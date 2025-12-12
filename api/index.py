import sys
import os

# Add the parent directory (root of the repo) to sys.path so 'backend' can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app
