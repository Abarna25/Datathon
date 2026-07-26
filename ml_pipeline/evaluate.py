import os
import pandas as pd
import numpy as np
import joblib
import json
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import shap
from utils import setup_logger
from config import OUTPUT_DIR, MODEL_DIR

logger = setup_logger("evaluate")

def evaluate_classification(model, X_test, y_test):
    y_pred = model.predict(X_test)
    
    metrics = {
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
        'recall': float(recall_score(y_test, y_pred, average='weighted', zero_division=0)),
        'f1_score': float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
    }
    
    report = classification_report(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    logger.info(f"Classification Metrics: {metrics}")
    logger.info(f"Classification Report:\n{report}")
    
    return metrics, report, cm

def evaluate_regression(model, X_test, y_test):
    y_pred = model.predict(X_test)
    
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    mae = float(mean_absolute_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))
    
    metrics = {
        'mse': mse,
        'rmse': rmse,
        'mae': mae,
        'r2': r2
    }
    
    logger.info(f"Regression Metrics: {metrics}")
    
    return metrics, None, None

def generate_shap_explanations(model, X_test):
    try:
        # Sample background data for SHAP to speed up explanation
        background = shap.sample(X_test, min(100, len(X_test)))
        explainer = shap.Explainer(model, background)
        # Calculate shap values for a sample
        sample_X = X_test.head(100)
        shap_values = explainer(sample_X)
        
        # Save SHAP values (optional, can be large)
        # We just log feature importance if it's a tree model
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            feature_names = X_test.columns
            importance_df = pd.DataFrame({'Feature': feature_names, 'Importance': importances})
            importance_df = importance_df.sort_values(by='Importance', ascending=False)
            logger.info(f"Top 10 Feature Importances:\n{importance_df.head(10)}")
            
            importance_df.to_csv(os.path.join(OUTPUT_DIR, "feature_importance.csv"), index=False)
            
    except Exception as e:
        logger.warning(f"Could not generate SHAP explanations: {str(e)}")

def evaluate_model(model, X_test, y_test, task_type: str, model_name: str):
    logger.info(f"Evaluating model: {model_name}")
    
    if task_type == 'classification':
        metrics, report, cm = evaluate_classification(model, X_test, y_test)
    else:
        metrics, report, cm = evaluate_regression(model, X_test, y_test)
        
    generate_shap_explanations(model, X_test)
    
    # Save metrics
    metrics_path = os.path.join(OUTPUT_DIR, "metrics.json")
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=4)
        
    logger.info(f"Metrics saved to {metrics_path}")
