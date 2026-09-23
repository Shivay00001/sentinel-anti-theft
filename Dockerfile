# Sentinel AI anomaly-detection service (FastAPI + scikit-learn IsolationForest).
# Other components (NestJS backend, Tauri desktop agent, mobile app, web dashboard)
# are built/run separately; see README.
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY ai-service/ ./ai_service/
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
