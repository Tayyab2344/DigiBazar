import os
import sys

# Add apps/api directory to sys.path so app module is importable by Vercel serverless worker
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
