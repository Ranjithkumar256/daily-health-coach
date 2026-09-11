#!/usr/bin/env python3
"""
Daily Health Coach - Quick Launcher
Run this script to start the FastAPI server and launch the Web & Android application.
"""
import sys
import os
import uvicorn

if __name__ == "__main__":
    # Ensure current directory is in sys.path
    project_dir = os.path.dirname(os.path.abspath(__file__))
    if project_dir not in sys.path:
        sys.path.insert(0, project_dir)

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    print("\n" + "=" * 60)
    print("🌿 DAILY HEALTH COACH - Web & Android Application Server")
    print("=" * 60)
    print(f"-> Application URL:   http://localhost:{port}")
    print(f"-> Interactive Docs:  http://localhost:{port}/docs")
    print(f"-> PWA & Android:     Open in mobile browser & tap 'Add to Home Screen'")
    print("=" * 60 + "\n")

    uvicorn.run("app.main:app", host=host, port=port, reload=True)
