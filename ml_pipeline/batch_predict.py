import pandas as pd
import joblib
import os
from catalyst_client import get_catalyst_app
from datastore_loader import fetch_table_data
from feature_engineering import encode_and_scale
from utils import setup_logger
from config import MODEL_DIR

logger = setup_logger("batch_predict")

def batch_predict(input_table_name: str, output_table_name: str = None):
    app = get_catalyst_app()
    
    logger.info(f"Fetching data from {input_table_name} for batch prediction...")
    df = fetch_table_data(app, input_table_name)
    
    if df.empty:
        logger.warning("No data found for prediction.")
        return
        
    # Load model
    model_path = os.path.join(MODEL_DIR, "trained_model.pkl")
    if not os.path.exists(model_path):
        logger.error("Model not found. Please train first.")
        return
        
    model = joblib.load(model_path)
    
    # Preprocess
    df_processed = encode_and_scale(df, is_training=False)
    
    # Predict
    logger.info("Running predictions...")
    predictions = model.predict(df_processed)
    
    # Decode predictions
    target_encoder_path = os.path.join(MODEL_DIR, "target_encoder.pkl")
    if os.path.exists(target_encoder_path):
        le = joblib.load(target_encoder_path)
        if le is not None:
            predictions = le.inverse_transform(predictions)
            
    df['prediction'] = predictions
    
    logger.info("Batch prediction completed.")
    
    # Optionally save to a new table or update existing
    # Example:
    # if output_table_name:
    #     insert_rows = df.to_dict('records')
    #     datastore = app.datastore()
    #     datastore.table(output_table_name).insert_rows(insert_rows)
    
    return df

if __name__ == "__main__":
    # Example usage:
    batch_predict("NewData", "PredictionsTable")
