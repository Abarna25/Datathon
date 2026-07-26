import os
import pandas as pd
from sklearn.model_selection import train_test_split
from datastore_loader import load_and_merge_data
from preprocessing import preprocess_pipeline
from feature_engineering import encode_and_scale
from model_selection import train_and_select_best_model
from evaluate import evaluate_model
from utils import setup_logger, PipelineException
from config import TARGET_COLUMN, PROBLEM_TYPE

logger = setup_logger("train")

def determine_task_type(y: pd.Series) -> str:
    """
    Infers if the task is classification or regression.
    """
    if PROBLEM_TYPE != "auto":
        return PROBLEM_TYPE
        
    if y.dtype == 'object' or y.dtype == 'bool' or y.nunique() < 20:
        return 'classification'
    else:
        return 'regression'

def run_training_pipeline(table_names: list):
    try:
        logger.info("=== Starting Training Pipeline ===")
        
        # 1. Load Data
        df = load_and_merge_data(table_names)
        if df.empty:
            raise PipelineException("Loaded dataset is empty.")
            
        if TARGET_COLUMN not in df.columns:
            raise PipelineException(f"Target column '{TARGET_COLUMN}' not found in dataset.")
            
        # 2. Preprocessing
        df_clean = preprocess_pipeline(df)
        
        # 3. Feature Engineering & Scaling
        df_processed = encode_and_scale(df_clean, is_training=True)
        
        # 4. Train-Test Split
        X = df_processed.drop(columns=[TARGET_COLUMN])
        y = df_processed[TARGET_COLUMN]
        
        task_type = determine_task_type(y)
        logger.info(f"Determined task type: {task_type}")
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # 5. Model Selection & Training
        best_model, model_name = train_and_select_best_model(X_train, y_train, task_type)
        
        # 6. Evaluation
        evaluate_model(best_model, X_test, y_test, task_type, model_name)
        
        logger.info("=== Training Pipeline Completed Successfully ===")
        
    except Exception as e:
        logger.error(f"Training pipeline failed: {str(e)}")
        raise e
