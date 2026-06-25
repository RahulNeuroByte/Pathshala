import os
import re

def check_imports():
    errors = []
    for root, dirs, files in os.walk("/home/ubuntu/Pathshala/backend"):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    content = f.read()
                    # Basic check for common import patterns
                    if "from backend." in content or "import backend." in content:
                        pass # Valid
    return errors

def run_audit():
    print("Starting Consistency Audit...")
    
    # 1. Check Directory Structure
    required_dirs = ['backend', 'database', 'frontend', 'docs', 'tests', 'docker', 'assets', 'uml', 'scripts']
    for d in required_dirs:
        if not os.path.exists(f"/home/ubuntu/Pathshala/{d}"):
            print(f"FAIL: Missing directory {d}")
    
    # 2. Check Core Files
    core_files = [
        'PROJECT_MANIFEST.md', 'GENERATION_STATUS.md', 'CONTEXT_SUMMARY.md', 'LOCKED_FILES.md',
        'backend/main.py', 'backend/requirements.txt', 'database/schema.sql'
    ]
    for f in core_files:
        if not os.path.exists(f"/home/ubuntu/Pathshala/{f}"):
            print(f"FAIL: Missing core file {f}")
            
    print("Audit Complete.")

if __name__ == "__main__":
    run_audit()
