#!/usr/bin/env python3
"""
ml_service.py
Production Python ML Pipeline for VIKSHANA.
Performs DBSCAN spatial clustering on crime coordinates and
Statistical Time-Series forecasting with confidence intervals.
"""

import sys
import json
import numpy as np

def run_dbscan_hotspots(data):
    """
    Executes real DBSCAN spatial clustering on GPS coordinates.
    """
    coordinates = data.get('coordinates', [])
    eps_km = float(data.get('epsKm', 2.0))
    min_samples = int(data.get('minSamples', 3))

    if not coordinates or len(coordinates) < min_samples:
        return {
            "status": "INSUFFICIENT_DATA_FOR_CLUSTERING",
            "message": f"At least {min_samples} spatial coordinate points are required to form clusters.",
            "totalPoints": len(coordinates),
            "clusters": [],
            "noisePoints": len(coordinates)
        }

    try:
        from sklearn.cluster import DBSCAN
        coords_arr = np.array([[float(c['lat']), float(c['lng'])] for c in coordinates])
        coords_rad = np.radians(coords_arr)
        
        # Earth radius in kilometers
        earth_radius_km = 6371.0
        eps_rad = eps_km / earth_radius_km

        db = DBSCAN(eps=eps_rad, min_samples=min_samples, algorithm='ball_tree', metric='haversine')
        labels = db.fit_predict(coords_rad)

        unique_labels = set(labels)
        clusters = []
        noise_count = int(np.sum(labels == -1))

        for k in unique_labels:
            if k == -1:
                continue
            class_member_mask = (labels == k)
            cluster_coords = coords_arr[class_member_mask]
            
            centroid_lat = float(np.mean(cluster_coords[:, 0]))
            centroid_lng = float(np.mean(cluster_coords[:, 1]))
            case_count = int(np.sum(class_member_mask))

            clusters.append({
                "clusterId": int(k),
                "center": {"lat": round(centroid_lat, 6), "lng": round(centroid_lng, 6)},
                "caseCount": case_count,
                "densityScore": round(float(case_count / len(coordinates)), 4),
                "radiusKm": eps_km
            })

        return {
            "status": "SUCCESS",
            "algorithm": "DBSCAN (Haversine Metric)",
            "totalPointsAnalyzed": len(coordinates),
            "clusterCount": len(clusters),
            "noisePoints": noise_count,
            "clusters": clusters
        }
    except Exception as e:
        return {"status": "ERROR", "error": str(e), "clusters": []}


def run_time_series_forecast(data):
    """
    Executes linear trend and polynomial forecasting with confidence intervals.
    """
    historical_points = data.get('historicalCounts', [])
    forecast_periods = int(data.get('periodsAhead', 6))

    if not historical_points or len(historical_points) < 4:
        return {
            "status": "INSUFFICIENT_DATA_FOR_FORECAST",
            "message": "At least 4 historical time intervals are required to train time-series trend model.",
            "forecast": []
        }

    try:
        from sklearn.linear_model import Ridge
        y = np.array([float(p['count']) for p in historical_points])
        X = np.arange(len(y)).reshape(-1, 1)

        model = Ridge(alpha=1.0)
        model.fit(X, y)

        # Residual standard deviation for 95% confidence interval (approx 1.96 * sigma)
        residuals = y - model.predict(X)
        sigma = float(np.std(residuals)) if len(residuals) > 1 else 1.0
        ci_margin = 1.96 * sigma

        # Generate future periods
        future_X = np.arange(len(y), len(y) + forecast_periods).reshape(-1, 1)
        future_preds = model.predict(future_X)

        forecast_results = []
        for i, pred in enumerate(future_preds):
            pred_val = max(0, round(float(pred), 1))
            forecast_results.append({
                "periodIndex": len(y) + i + 1,
                "predictedCount": pred_val,
                "confidenceInterval95": {
                    "lower": max(0, round(pred_val - ci_margin, 1)),
                    "upper": round(pred_val + ci_margin, 1)
                }
            })

        # Calculate R-squared
        r2_score = float(model.score(X, y))

        return {
            "status": "SUCCESS",
            "model": "Ridge Regression Time-Series Trend Model",
            "historicalPeriods": len(y),
            "forecastPeriods": forecast_periods,
            "modelFitR2": round(r2_score, 4),
            "residualStdDev": round(sigma, 4),
            "forecast": forecast_results
        }
    except Exception as e:
        return {"status": "ERROR", "error": str(e), "forecast": []}


def get_health():
    import sklearn
    return {
        "status": "ONLINE",
        "service": "VIKSHANA Python ML Microservice",
        "pythonVersion": sys.version,
        "scikitLearnVersion": sklearn.__version__,
        "supportedAlgorithms": ["DBSCAN_SPATIAL_CLUSTERING", "RIDGE_TIME_SERIES_FORECAST"]
    }


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--health':
        print(json.dumps(get_health()))
        return

    # Read JSON from stdin
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            print(json.dumps({"error": "Empty input"}))
            return
        payload = json.loads(raw_input)
        action = payload.get('action')

        if action == 'hotspots':
            res = run_dbscan_hotspots(payload)
        elif action == 'forecast':
            res = run_time_series_forecast(payload)
        elif action == 'health':
            res = get_health()
        else:
            res = {"error": f"Unknown action '{action}'"}

        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
