import os
import joblib
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier, XGBRegressor
from lightgbm import LGBMClassifier, LGBMRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.model_selection import GridSearchCV
from utils import setup_logger, PipelineException
from config import MODEL_DIR

logger = setup_logger("model_selection")

def get_models(task_type: str) -> dict:
    if task_type == 'classification':
        return {
            'RandomForest': (RandomForestClassifier(random_state=42), {
                'n_estimators': [50, 100],
                'max_depth': [None, 10, 20]
            }),
            'XGBoost': (XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'), {
                'n_estimators': [50, 100],
                'learning_rate': [0.01, 0.1]
            }),
            'LightGBM': (LGBMClassifier(random_state=42), {
                'n_estimators': [50, 100],
                'learning_rate': [0.01, 0.1]
            }),
            'LogisticRegression': (LogisticRegression(max_iter=1000), {
                'C': [0.1, 1.0, 10.0]
            })
        }
    elif task_type == 'regression':
        return {
            'RandomForest': (RandomForestRegressor(random_state=42), {
                'n_estimators': [50, 100],
                'max_depth': [None, 10, 20]
            }),
            'XGBoost': (XGBRegressor(random_state=42), {
                'n_estimators': [50, 100],
                'learning_rate': [0.01, 0.1]
            }),
            'LightGBM': (LGBMRegressor(random_state=42), {
                'n_estimators': [50, 100],
                'learning_rate': [0.01, 0.1]
            }),
            'LinearRegression': (LinearRegression(), {})
        }
    else:
        raise PipelineException(f"Unknown task type: {task_type}")

def train_and_select_best_model(X_train, y_train, task_type: str):
    logger.info(f"Starting model selection for task type: {task_type}")
    models_and_params = get_models(task_type)
    
    best_model = None
    best_score = -float('inf')
    best_model_name = ""
    
    scoring_metric = 'accuracy' if task_type == 'classification' else 'neg_mean_squared_error'
    
    for name, (model, params) in models_and_params.items():
        logger.info(f"Training and tuning {name}...")
        try:
            grid_search = GridSearchCV(estimator=model, param_grid=params, scoring=scoring_metric, cv=3, n_jobs=-1, verbose=1)
            grid_search.fit(X_train, y_train)
            
            score = grid_search.best_score_
            logger.info(f"{name} best score ({scoring_metric}): {score}")
            
            if score > best_score:
                best_score = score
                best_model = grid_search.best_estimator_
                best_model_name = name
        except Exception as e:
            logger.error(f"Error training {name}: {str(e)}")
            
    if best_model is None:
        raise PipelineException("Failed to train any model.")
        
    logger.info(f"Best model selected: {best_model_name} with score {best_score}")
    
    # Save the model
    model_path = os.path.join(MODEL_DIR, "trained_model.pkl")
    joblib.dump(best_model, model_path)
    logger.info(f"Saved best model to {model_path}")
    
    return best_model, best_model_name
