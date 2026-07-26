import os
from catalyst_client import get_catalyst_app
from utils import setup_logger, PipelineException
from config import MODEL_DIR, CATALYST_FOLDER_ID

logger = setup_logger("upload_model")

def upload_file_to_catalyst(app, file_path: str, folder_id: str):
    """
    Uploads a single file to Zoho Catalyst File Store.
    """
    if not os.path.exists(file_path):
        logger.warning(f"File {file_path} does not exist, skipping upload.")
        return
        
    try:
        filestore = app.filestore()
        folder = filestore.folder(folder_id)
        
        with open(file_path, 'rb') as f:
            file_obj = folder.upload_file(f)
            
        logger.info(f"Successfully uploaded {file_path}. File ID: {file_obj.get_id()}")
        
    except Exception as e:
        logger.error(f"Error uploading {file_path}: {str(e)}")
        raise PipelineException(f"Error uploading {file_path}: {str(e)}")

def upload_all_artifacts():
    """
    Uploads all model artifacts from MODEL_DIR to Catalyst.
    """
    app = get_catalyst_app()
    
    files_to_upload = [
        "trained_model.pkl",
        "preprocessor.pkl",
        "feature_columns.pkl",
        "target_encoder.pkl"
    ]
    
    logger.info("Starting upload of model artifacts to Zoho Catalyst File Store...")
    for filename in files_to_upload:
        file_path = os.path.join(MODEL_DIR, filename)
        upload_file_to_catalyst(app, file_path, CATALYST_FOLDER_ID)
        
    logger.info("All artifacts uploaded successfully.")
