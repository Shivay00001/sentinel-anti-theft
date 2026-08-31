from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from sklearn.ensemble import IsolationForest
import numpy as np

app = FastAPI(title="Sentinel AI Engine")

class LocationData(BaseModel):
    device_id: str
    lat: float
    lng: float
    timestamp: int
    is_locked: bool

# Dummy mock for in-memory historical data tracking (would use DB in production)
history_db = []
# Pre-trained model mock
clf = IsolationForest(contamination=0.01)

@app.post("/analyze")
async def analyze_location(data: LocationData):
    """
    Analyzes live location data against the device's historical profile
    to detect behavioral anomalies (e.g. moving fast at odd hours while locked).
    """
    # 1. Store incoming data point
    history_db.append({
        "lat": data.lat,
        "lng": data.lng,
        "timestamp": data.timestamp,
        "is_locked": data.is_locked
    })
    
    # 2. Need enough data points to detect an anomaly
    if len(history_db) < 10:
        return {"status": "learning", "anomaly_detected": False}
        
    # 3. Very naive implementation of anomaly detection for the skeleton
    # In reality, this would use a robust Spatio-Temporal model.
    recent_data = pd.DataFrame(history_db[-10:])
    features = recent_data[['lat', 'lng']].values
    
    # Fit & Predict (In prod, model is pre-fitted per device or globally)
    clf.fit(features)
    current_point = np.array([[data.lat, data.lng]])
    prediction = clf.predict(current_point)
    
    is_anomaly = prediction[0] == -1 and data.is_locked
    
    return {
        "status": "success",
        "anomaly_detected": bool(is_anomaly),
        "message": "Unusual movement detected!" if is_anomaly else "Normal behavior"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
