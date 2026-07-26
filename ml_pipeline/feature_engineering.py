import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from utils import setup_logger
import joblib
import os
from config import MODEL_DIR, TARGET_COLUMN

logger = setup_logger("feature_engineering")

def extract_datetime_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts year, month, day from datetime columns and drops the original.
    """
    df_copy = df.copy()
    datetime_cols = df_copy.select_dtypes(include=['datetime64']).columns
    
    for col in datetime_cols:
        df_copy[f"{col}_year"] = df_copy[col].dt.year
        df_copy[f"{col}_month"] = df_copy[col].dt.month
        df_copy[f"{col}_day"] = df_copy[col].dt.day
        df_copy = df_copy.drop(columns=[col])
        logger.info(f"Extracted datetime features for {col}")
        
    return df_copy

def encode_and_scale(df: pd.DataFrame, is_training=True):
    """
    Encodes categorical variables and scales numerical variables.
    Saves/loads transformers.
    """
    df_copy = df.copy()
    df_copy = extract_datetime_features(df_copy)
    
    # Separate target if it exists
    target = None
    if TARGET_COLUMN and TARGET_COLUMN in df_copy.columns:
        target = df_copy[TARGET_COLUMN]
        df_copy = df_copy.drop(columns=[TARGET_COLUMN])
        
    numeric_cols = df_copy.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_cols = df_copy.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()
    
    # Convert booleans to strings for unified categorical encoding
    for col in categorical_cols:
        if df_copy[col].dtype == 'bool':
             df_copy[col] = df_copy[col].astype(str)
             
    preprocessor_path = os.path.join(MODEL_DIR, "preprocessor.pkl")
    
    if is_training:
        logger.info(f"Numeric columns: {numeric_cols}")
        logger.info(f"Categorical columns: {categorical_cols}")
        
        # We use OneHotEncoder for categorical and StandardScaler for numerical
        transformers = []
        if numeric_cols:
            transformers.append(('num', StandardScaler(), numeric_cols))
        if categorical_cols:
            # handle_unknown='ignore' allows the model to handle unseen categories during inference
            transformers.append(('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols))
            
        preprocessor = ColumnTransformer(transformers=transformers, remainder='passthrough')
        
        processed_data = preprocessor.fit_transform(df_copy)
        
        # Get feature names if possible
        feature_names = []
        if numeric_cols:
            feature_names.extend(numeric_cols)
        if categorical_cols:
            cat_features = preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_cols)
            feature_names.extend(cat_features)
            
        joblib.dump(preprocessor, preprocessor_path)
        joblib.dump(feature_names, os.path.join(MODEL_DIR, "feature_columns.pkl"))
        logger.info("Saved preprocessor and feature columns to model directory.")
        
    else:
        if not os.path.exists(preprocessor_path):
            raise Exception("Preprocessor not found. Please train the model first.")
        preprocessor = joblib.load(preprocessor_path)
        processed_data = preprocessor.transform(df_copy)
        feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_columns.pkl"))
        
    df_processed = pd.DataFrame(processed_data, columns=feature_names, index=df_copy.index)
    
    # Process target if we are training or if it's available
    target_encoder_path = os.path.join(MODEL_DIR, "target_encoder.pkl")
    if target is not None:
        if is_training:
            # If target is categorical, encode it
            if target.dtype == 'object' or target.dtype == 'category' or target.dtype == 'bool':
                le = LabelEncoder()
                target_encoded = le.fit_transform(target.astype(str))
                joblib.dump(le, target_encoder_path)
                logger.info("Saved target label encoder.")
            else:
                target_encoded = target.values
                # Save an empty marker to know it's regression/numeric
                joblib.dump(None, target_encoder_path)
        else:
            if os.path.exists(target_encoder_path):
                le = joblib.load(target_encoder_path)
                if le is not None:
                    target_encoded = le.transform(target.astype(str))
                else:
                    target_encoded = target.values
            else:
                target_encoded = target.values
                
        df_processed[TARGET_COLUMN] = target_encoded
        
    return df_processed
