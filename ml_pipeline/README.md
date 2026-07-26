# Zoho Catalyst Machine Learning Pipeline

An enterprise-ready, automated machine learning pipeline tailored for Zoho Catalyst. This pipeline retrieves datasets directly from Zoho Catalyst Data Store, preprocesses them, trains classification or regression models, and uploads the final model artifacts to the Zoho Catalyst File Store.

## Features
- **Automated Data Retrieval**: Handles pagination and retrieves all records from Data Store.
- **Data Engineering**: Infers types, handles missing values, and merges tables.
- **Feature Engineering**: One-Hot Encoding, scaling, and datetime extraction.
- **Model Selection**: Automatically selects and tunes the best model (RandomForest, XGBoost, LightGBM, etc.).
- **Evaluation**: Logs metrics, confusion matrix, and feature importances (SHAP).
- **Model Persistence**: Uploads `.pkl` files securely to Catalyst File Store.
- **Inference**: Ready-to-use API and batch prediction scripts.

## Setup Instructions

1. **Clone/Copy the code** to your local environment or a Catalyst Advanced I/O function environment.
2. **Install requirements**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Catalyst credentials.
   ```env
   CATALYST_PROJECT_ID=...
   CATALYST_CLIENT_ID=...
   CATALYST_CLIENT_SECRET=...
   CATALYST_REFRESH_TOKEN=...
   CATALYST_ENVIRONMENT=Development
   TARGET_COLUMN=your_target_variable
   CATALYST_FOLDER_ID=your_file_store_folder_id
   ```

## Usage

### 1. Training the Model
Edit `main.py` to specify your table names:
```python
table_names = ["YourTableName"]
```
Run the training pipeline:
```bash
python main.py
```
This will:
- Download data.
- Train the best model.
- Save artifacts in the `models/` folder.
- Upload the artifacts to Catalyst File Store.
- Save metrics in `outputs/`.

### 2. Batch Inference
To run predictions on a new dataset from Catalyst Data Store, edit and run:
```bash
python batch_predict.py
```

### 3. API Inference (Flask)
Start the inference server:
```bash
python api.py
```
Send a POST request:
```bash
curl -X POST http://localhost:5000/predict -H "Content-Type: application/json" -d '[{"feature1": 10, "feature2": "A"}]'
```

## Deployment on Zoho Catalyst
To deploy this as a Catalyst Advanced I/O Function:
1. Create a Catalyst Python Basic I/O or Advanced I/O function.
2. Copy these files into the function directory.
3. Move dependencies from `requirements.txt` to the function's requirements file.
4. Call the methods from your function's entry point. Ensure environment variables are set via Catalyst Environment Variables configuration in the console.

## Architecture
- `config.py`: Central configuration management.
- `catalyst_client.py`: Auth and SDK initialization.
- `datastore_loader.py`: Data retrieval and merging.
- `preprocessing.py`: Cleaning and type inference.
- `feature_engineering.py`: Encoding and scaling.
- `train.py`, `evaluate.py`, `model_selection.py`: Core ML logic.
- `upload_model.py`: Artifact persistence.
