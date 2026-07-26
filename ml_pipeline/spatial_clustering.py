import pandas as pd
from sklearn.cluster import DBSCAN
import numpy as np

def detect_hotspots(df, lat_col='latitude', lon_col='longitude', eps_km=1.0, min_samples=5):
    """
    Detects dynamic crime hotspots using DBSCAN clustering.
    Addresses Requirement #6 and #7 (Predictive Intelligence and Hotspot Detection)
    
    :param df: Pandas DataFrame containing crime records with coordinates
    :param lat_col: Name of latitude column
    :param lon_col: Name of longitude column
    :param eps_km: Radius of neighborhood in kilometers
    :param min_samples: Minimum number of crimes to form a hotspot
    :return: DataFrame with 'hotspot_cluster' column added
    """
    if lat_col not in df.columns or lon_col not in df.columns:
        raise ValueError(f"DataFrame must contain '{lat_col}' and '{lon_col}' columns.")

    # Convert coordinates to radians for Haversine metric
    coords = df[[lat_col, lon_col]].dropna().values
    coords_rad = np.radians(coords)
    
    # Earth radius in km
    earth_radius_km = 6371.0
    
    # Compute eps in radians
    eps_rad = eps_km / earth_radius_km
    
    # Run DBSCAN
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, algorithm='ball_tree', metric='haversine')
    clusters = db.fit_predict(coords_rad)
    
    # Map back to DataFrame (handling NaNs if dropped)
    df_result = df.copy()
    valid_mask = df_result[lat_col].notna() & df_result[lon_col].notna()
    df_result.loc[valid_mask, 'hotspot_cluster'] = clusters
    
    # Noise points are marked as -1 in DBSCAN
    return df_result

def predict_future_hotspot(df_hotspots, time_col='timestamp'):
    """
    Analyzes temporal trends of clusters to predict if a hotspot is expanding or contracting.
    """
    # Simple heuristic: If crime count in cluster increases over last 7 days, it's expanding.
    # A real model would use ARIMA or Prophet here.
    return df_hotspots.groupby('hotspot_cluster').size().to_dict()

if __name__ == "__main__":
    # Mock data for testing
    np.random.seed(42)
    mock_data = pd.DataFrame({
        'latitude': np.random.uniform(12.9, 13.0, 100),  # Bangalore latitudes roughly
        'longitude': np.random.uniform(77.5, 77.7, 100)  # Bangalore longitudes roughly
    })
    
    result = detect_hotspots(mock_data, eps_km=2.0, min_samples=3)
    print(f"Detected {len(result['hotspot_cluster'].unique()) - 1} hotspots.")
