"""
Unified dev script to run both Backend (FastAPI) and Worker (Celery).
Usage: python run_all.py
"""
import subprocess
import sys
import time
import os

def run_all():
    processes = []
    try:
        print("🚀 Starting Backend and Celery Worker...")
        
        # 1. Start Backend
        # Calls main.py which has uvicorn.run inside
        backend_proc = subprocess.Popen(
            [sys.executable, "main.py"],
            stdout=None,
            stderr=None
        )
        processes.append(backend_proc)
        print("✅ Backend started (PID: {})".format(backend_proc.pid))

        # Wait a bit for backend to initialize
        time.sleep(2)

        # 2. Start Worker
        # Running celery command directly without needing a separate worker.py file
        # -A app.core.celery_config.celery_app: points to the celery instance
        # -P solo: required for Windows stability
        worker_cmd = [
            "celery", 
            "-A", "app.core.celery_config.celery_app", 
            "worker", 
            "--loglevel=info", 
            "-P", "solo"
        ]
        
        worker_proc = subprocess.Popen(
            worker_cmd,
            stdout=None,
            stderr=None
        )
        processes.append(worker_proc)
        print("✅ Celery Worker started (PID: {})".format(worker_proc.pid))

        # 3. Start Flower (Celery Monitoring)
        print("🔍 Starting Flower (Monitoring)...")
        flower_cmd = [
            "celery", 
            "-A", "app.core.celery_config.celery_app", 
            "flower", 
            "--port=5555"
        ]
        flower_proc = subprocess.Popen(
            flower_cmd,
            stdout=None,
            stderr=None
        )
        processes.append(flower_proc)
        print("✅ Flower started (PID: {}). Access at http://localhost:5555".format(flower_proc.pid))

        print("\n📝 All services are running. Press Ctrl+C to stop all.\n")
        print("🔗 URLs:")
        print("   - API: http://localhost:8000")
        print("   - Monitoring (Flower): http://localhost:5555\n")

        # Keep the main script alive while processes are running
        while True:
            time.sleep(1)
            
            # Check if any process died unexpectedly
            if backend_proc.poll() is not None:
                print("⚠️ Backend stopped unexpectedly.")
                break
            if worker_proc.poll() is not None:
                print("⚠️ Worker stopped unexpectedly.")
                break
            if flower_proc.poll() is not None:
                print("⚠️ Flower stopped unexpectedly.")
                break

    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
    finally:
        for p in processes:
            try:
                p.terminate()
                print("Terminated process {}".format(p.pid))
            except Exception:
                pass
        print("👋 Done.")

if __name__ == "__main__":
    # Ensure we are in the backend directory context if run from elsewhere
    # (Though usually user runs it from the backend folder)
    run_all()
