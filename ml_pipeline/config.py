import os
from dotenv import load_dotenv

load_dotenv()

# Catalyst config
PROJECT_ID = os.getenv("CATALYST_PROJECT_ID")
CLIENT_ID = os.getenv("CATALYST_CLIENT_ID")
CLIENT_SECRET = os.getenv("CATALYST_CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("CATALYST_REFRESH_TOKEN")
ENVIRONMENT = os.getenv("CATALYST_ENVIRONMENT", "Development")

# ML Config
TARGET_COLUMN = os.getenv("TARGET_COLUMN", "target")
# If MERGE_ON is set, datasets will be merged on this column if it exists in multiple datasets
MERGE_ON = os.getenv("MERGE_ON", None)
if MERGE_ON == "":
    MERGE_ON = None
# Options: classification, regression, auto
PROBLEM_TYPE = os.getenv("PROBLEM_TYPE", "auto") 

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
LOG_DIR = os.path.join(BASE_DIR, "logs")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

# File Store
CATALYST_FOLDER_ID = os.getenv("CATALYST_FOLDER_ID", "default_folder_id")

# Create directories if they don't exist
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
