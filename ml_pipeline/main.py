from train import run_training_pipeline
from upload_model import upload_all_artifacts
from utils import setup_logger

logger = setup_logger("main")

def main():
    # Replace these with your actual Catalyst table names
    # E.g., table_names = ["Users", "Transactions"]
    table_names = ["YourTableNameHere"]
    
    try:
        logger.info("Starting Catalyst ML Pipeline...")
        
        # Run training
        run_training_pipeline(table_names)
        
        # Upload artifacts
        upload_all_artifacts()
        
        logger.info("Pipeline executed successfully!")
        
    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")

if __name__ == "__main__":
    main()
