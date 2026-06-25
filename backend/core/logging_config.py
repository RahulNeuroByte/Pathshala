import logging
import logging.handlers
import os
from datetime import datetime

# In a real Windows environment, this would be relative to the project root
# For the package, we'll use a relative path that works on Windows
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Define log file paths
APP_LOG = os.path.join(LOGS_DIR, "app.log")
ERROR_LOG = os.path.join(LOGS_DIR, "error.log")

# Create a custom logger
logger = logging.getLogger("pathshala")
logger.setLevel(logging.DEBUG)

# Create formatters
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# App log handler (INFO and above)
app_handler = logging.handlers.RotatingFileHandler(APP_LOG, maxBytes=10*1024*1024, backupCount=5)
app_handler.setLevel(logging.INFO)
app_handler.setFormatter(formatter)

# Error log handler (ERROR and above)
error_handler = logging.handlers.RotatingFileHandler(ERROR_LOG, maxBytes=10*1024*1024, backupCount=5)
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(formatter)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(formatter)

# Add handlers to the logger
logger.addHandler(app_handler)
logger.addHandler(error_handler)
logger.addHandler(console_handler)

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"pathshala.{name}")
