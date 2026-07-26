from flask import Flask, request, jsonify
import pandas as pd
import joblib
import os
from feature_engineering import encode_and_scale
from utils import setup_logger

app = Flask(__name__)
logger = setup_logger("api")

MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "trained_model.pkl")

# Load model globally to avoid loading on every request
try:
    model = joblib.load(MODEL_PATH)
    logger.info("Model loaded successfully for API.")
except Exception as e:
    logger.error(f"Could not load model: {str(e)}")
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model is not loaded."}), 500
        
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided."}), 400
            
        # If single object, convert to list
        if isinstance(data, dict):
            data = [data]
            
        df = pd.DataFrame(data)
        
        # Preprocess features (False because we are doing inference)
        df_processed = encode_and_scale(df, is_training=False)
        
        predictions = model.predict(df_processed)
        
        # Inverse transform predictions if it was a classification task
        target_encoder_path = os.path.join(MODEL_DIR, "target_encoder.pkl")
        if os.path.exists(target_encoder_path):
            le = joblib.load(target_encoder_path)
            if le is not None:
                predictions = le.inverse_transform(predictions)
                
        return jsonify({"predictions": predictions.tolist()})
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
