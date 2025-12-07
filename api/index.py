import sys
import os

# Add the 'backend' directory to sys.path
# Since this file is in /api/index.py, the root is one level up '..'
# and the backend is in '../backend'
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, 'backend')

sys.path.append(backend_dir)

from app.main import app
