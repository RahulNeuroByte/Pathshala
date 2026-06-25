import os
import importlib.util
import sys

# Add backend to path
sys.path.append("/home/ubuntu/Pathshala")

def check_imports():
    errors = []
    base_dir = "/home/ubuntu/Pathshala/backend"
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".py") and not file.startswith("__"):
                filepath = os.path.join(root, file)
                try:
                    # Check for syntax errors and basic import issues
                    with open(filepath, "r") as f:
                        compile(f.read(), filepath, "exec")
                except Exception as e:
                    errors.append(f"Syntax/Import error in {filepath}: {e}")
    return errors

def check_db_mappings():
    errors = []
    # This would check if all models in models.py have corresponding entries in schema.sql
    # For now, we'll check if models.py can be imported without error
    try:
        from backend.models import models
    except Exception as e:
        errors.append(f"Error importing backend.models.models: {e}")
    return errors

def check_frontend_consistency():
    errors = []
    # Check if all referenced pages in App.tsx exist
    app_tsx_path = "/home/ubuntu/Pathshala/frontend/src/App.tsx"
    if os.path.exists(app_tsx_path):
        with open(app_tsx_path, "r") as f:
            content = f.read()
            # Simple regex to find imports from ./pages/
            import_matches = re.findall(r"import .* from './pages/(.*)';", content)
            for page in import_matches:
                page_path = f"/home/ubuntu/Pathshala/frontend/src/pages/{page}.tsx"
                if not os.path.exists(page_path):
                    errors.append(f"Frontend page missing: {page_path} (referenced in App.tsx)")
    return errors

if __name__ == "__main__":
    import re
    print("Starting deep audit...")
    import_errors = check_imports()
    db_errors = check_db_mappings()
    frontend_errors = check_frontend_consistency()
    
    all_errors = import_errors + db_errors + frontend_errors
    
    if all_errors:
        print("\n--- AUDIT FAILED: Errors Found ---")
        for err in all_errors:
            print(f"- {err}")
    else:
        print("\n--- AUDIT PASSED: No major errors found ---")
