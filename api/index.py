import sys
import os

# Ensure backend folder is in path for Vercel
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
