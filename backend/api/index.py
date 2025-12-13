import sys
import os

# Robust path handling for Vercel
# We need to ensure the resolved path to 'backend' or 'app' parent is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

# Add both current and parent to be safe, Vercel structure can vary
if current_dir not in sys.path:
    sys.path.append(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Also try adding 'backend' explicitly if we are in a monorepo structure
backend_dir = os.path.join(parent_dir, 'backend')
if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.append(backend_dir)

try:
    from app.main import app
except ImportError:
    # Fallback: maybe we are INSIDE backend?
    from main import app
