import pandas as pd
import numpy as np
from utils import setup_logger

logger = setup_logger("preprocessing")

def convert_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    Attempts to infer and convert column types (numeric, boolean, datetime).
    """
    df_copy = df.copy()
    for col in df_copy.columns:
        # Try to convert to numeric
        try:
            df_copy[col] = pd.to_numeric(df_copy[col])
            continue
        except (ValueError, TypeError):
            pass
            
        # Try to convert to datetime
        try:
            # We don't want to convert strings that are just categories to datetime
            # simple heuristic: if it looks like a date
            if df_copy[col].dtype == 'object' and any(isinstance(val, str) and ('-' in val or '/' in val) for val in df_copy[col].dropna().head()):
                df_copy[col] = pd.to_datetime(df_copy[col], format='mixed', errors='ignore')
        except (ValueError, TypeError):
            pass
            
        # Handle booleans
        if df_copy[col].dtype == 'object':
            unique_vals = df_copy[col].dropna().unique()
            if set(unique_vals).issubset({'true', 'false', 'True', 'False', '1', '0', 1, 0, True, False}):
                df_copy[col] = df_copy[col].map({'true': True, 'false': False, 'True': True, 'False': False, '1': True, '0': False, 1: True, 0: False})
                
    return df_copy

def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fills missing values: numerical with median, categorical with mode.
    """
    df_copy = df.copy()
    for col in df_copy.columns:
        if df_copy[col].isnull().sum() > 0:
            if pd.api.types.is_numeric_dtype(df_copy[col]):
                df_copy[col] = df_copy[col].fillna(df_copy[col].median())
                logger.info(f"Filled missing values in numerical column {col} with median.")
            else:
                mode_val = df_copy[col].mode()
                if not mode_val.empty:
                    df_copy[col] = df_copy[col].fillna(mode_val[0])
                    logger.info(f"Filled missing values in categorical column {col} with mode.")
                else:
                    df_copy[col] = df_copy[col].fillna("Unknown")
    return df_copy

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Removes duplicate rows.
    """
    initial_shape = df.shape
    df_copy = df.drop_duplicates()
    if df_copy.shape[0] < initial_shape[0]:
        logger.info(f"Removed {initial_shape[0] - df_copy.shape[0]} duplicate rows.")
    return df_copy

def detect_and_remove_outliers(df: pd.DataFrame, columns: list = None) -> pd.DataFrame:
    """
    Removes outliers using the IQR method for numerical columns.
    """
    df_copy = df.copy()
    if not columns:
        columns = df_copy.select_dtypes(include=['int64', 'float64']).columns.tolist()
        
    initial_shape = df_copy.shape
    for col in columns:
        Q1 = df_copy[col].quantile(0.25)
        Q3 = df_copy[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        df_copy = df_copy[(df_copy[col] >= lower_bound) & (df_copy[col] <= upper_bound)]
        
    if df_copy.shape[0] < initial_shape[0]:
        logger.info(f"Removed {initial_shape[0] - df_copy.shape[0]} outlier rows using IQR method.")
    return df_copy

def preprocess_pipeline(df: pd.DataFrame) -> pd.DataFrame:
    """
    Runs the full preprocessing pipeline.
    """
    logger.info("Starting preprocessing pipeline.")
    df = convert_types(df)
    df = remove_duplicates(df)
    df = handle_missing_values(df)
    # Note: Outlier removal is optional and can be applied specifically to training data
    # To be safe, we skip automatic outlier removal here to avoid removing target variance.
    # df = detect_and_remove_outliers(df)
    
    return df
