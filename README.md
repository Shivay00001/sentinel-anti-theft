# Sentinel Anti Theft

A production-grade, omni-platform anti-theft and location-tracking system featuring advanced anomaly detection, remote locking, and silent camera captures across Android, iOS, Windows, and macOS.

![Backend](https://img.shields.io/badge/Backend-NestJS%20%2B%20TypeScript-red)
![AI Engine](https://img.shields.io/badge/AI%20Engine-FastAPI%20%2B%20scikit--learn-blue)
![Desktop Agent](https://img.shields.io/badge/Desktop%20Agent-Tauri%20%2F%20Rust-orange)
![Status](https://img.shields.io/badge/Status-Active%20Development-yellow)
![License](https://img.shields.io/badge/License-VisionQuantech%20Custom%20Commercial-lightgrey)

## 🚀 Overview

Welcome to the **Sentinel Anti Theft** repository. Sentinel is a distributed, multi-component security platform designed to protect laptops and mobile devices against theft. It combines a **real-time WebSocket command & tracking backend**, a **machine-learning anomaly detection engine**, and a **stealth desktop agent** capable of remotely locking the machine and silently capturing intruder photos.

The system is built to deliver a robust and scalable solution tailored to modern development standards.

## ✨ Features

- **Real-Time Location Tracking:** Devices stream GPS coordinates over WebSockets (Socket.IO) to a central backend, which broadcasts live updates to dashboards.
- **AI-Powered Anomaly Detection:** A FastAPI microservice uses an `IsolationForest` model to compare live location pings against historical behavior, flagging suspicious movement (e.g., device moving while locked).
- **Remote Locking:** One-command remote lock for Windows (`LockWorkStation`) and macOS (`pmset displaysleepnow`) via the Tauri desktop agent.
- **Silent Intruder Capture:** The desktop agent is designed to silently capture webcam photos of a thief without displaying any UI.
- **Remote Alarm Triggering:** Backend can push a `sound_alarm` command to any connected device in real time.
- **Stealth Background Operation:** The desktop agent runs as a headless background daemon with no visible window.
- **Cross-Platform:** Windows, macOS (desktop agent), with Android/iOS client support planned.
- **Scalable Architecture:** Designed to grow with your needs.
- **Clean Codebase:** Follows best practices and industry standards (ESLint + Prettier, typed TypeScript, Pydantic validation).
- **Secure by Default:** Engineered with security in mind.

## 🏗️ Architecture / How It Works

Sentinel is a **microservices-style system** composed of three main components:

```
┌────────────────────┐        WebSocket (Socket.IO)        ┌──────────────────────┐
│  Desktop Agent     │  ───────────────────────────────▶  │   Backend (NestJS)   │
│  (Tauri / Rust)    │   updateLocation, triggerAlarm     │   Port 3000          │
│  - Remote lock     │ ◀───────────────────────────────   │  TrackingGateway     │
│  - Silent selfie   │   command-<deviceId> (sound_alarm) │                      │
└────────────────────┘                                     └──────────┬───────────┘
                                                                      │ HTTP POST /analyze
                                                                      ▼
                                                           ┌──────────────────────┐
                                                           │  AI Engine (FastAPI)  │
                                                           │  Port 8000            │
                                                           │  IsolationForest      │
                                                           │  anomaly detection    │
                                                           └──────────────────────┘
```

### 1. Backend — `backend/` (NestJS + Socket.IO, TypeScript)
- **`src/tracking/tracking.gateway.ts`** is the core WebSocket gateway (`@WebSocketGateway({ cors: true })`):
  - `updateLocation` — receives `{ deviceId, lat, lng, battery }` from devices, logs it, and re-broadcasts it on the channel `location-update-<deviceId>` for live dashboards. This is also the intended hook point for forwarding data to the AI engine or a database.
  - `triggerAlarm` — emits `{ action: 'sound_alarm' }` on `command-<deviceId>` so the target device sounds an alarm.
- **`src/main.ts`** bootstraps the Nest app on `process.env.PORT ?? 3000`.
- Standard NestJS tooling: Jest unit/e2e tests, ESLint (typed rules) + Prettier.

### 2. AI Engine — `ai-service/main.py` (FastAPI + scikit-learn)
- Exposes `POST /analyze` accepting `LocationData { device_id, lat, lng, timestamp, is_locked }`.
- Maintains an in-memory history buffer; once ≥10 points exist, it fits an `IsolationForest` (contamination 1%) on recent `(lat, lng)` features and predicts whether the current point is an outlier.
- An anomaly is only flagged when the point is an outlier **and** the device reports itself as locked — i.e., "the device is moving while it should be locked."
- Returns `{ status, anomaly_detected, message }`. Runs via Uvicorn on port `8000`.

### 3. Desktop Agent — `desktop/src-tauri/src/main.rs` (Tauri / Rust)
- Runs as a **headless background daemon** (no main window), spawning a listener thread for remote commands.
- Tauri commands:
  - `trigger_remote_lock` — locks Windows via `rundll32.exe user32.dll,LockWorkStation`, or macOS via `pmset displaysleepnow`.
  - `capture_intruder_selfie` — stub for silent webcam capture (intended to use `nokhwa`/`escapi` in production).

## 🛠️ Prerequisites

- **Node.js** ≥ 18 and **npm** (for the NestJS backend)
- **Python** ≥ 3.10 with `pip` (for the AI engine)
- **Rust toolchain** + Tauri prerequisites (for the desktop agent; see [Tauri docs](https://tauri.app/start/prerequisites/))
- **Docker** (optional, for containerized runs)

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Shivay00001/sentinel-anti-theft.git
   cd sentinel-anti-theft
   ```

2. **Backend (NestJS):**
   ```bash
   cd backend
   npm install
   ```

3. **AI Engine (FastAPI):**
   ```bash
   cd ai-service
   pip install fastapi uvicorn pandas scikit-learn numpy pydantic
   ```
   *(Note: the root `requirements.txt` is currently a placeholder — install the packages above manually.)*

4. **Desktop Agent (Tauri):**
   ```bash
   cd desktop
   npm install   # installs Tauri CLI / frontend deps
   ```

## 💻 Usage

### Run the Backend
```bash
cd backend
npm run start:dev      # watch mode (development)
# or
npm run build && npm run start:prod
```
The WebSocket gateway listens on `http://localhost:3000` (Socket.IO).

**Client events:**
| Direction | Event | Payload |
|---|---|---|
| Client → Server | `updateLocation` | `{ deviceId, lat, lng, battery }` |
| Client → Server | `triggerAlarm` | `{ deviceId }` |
| Server → Client | `location-update-<deviceId>` | location payload |
| Server → Client | `command-<deviceId>` | `{ action: 'sound_alarm' }` |

### Run the AI Engine
```bash
cd ai-service
uvicorn main:app --host 0.0.0.0 --port 8000
```
Test it:
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"device_id":"dev-1","lat":28.61,"lng":77.20,"timestamp":1735689600,"is_locked":true}'
```

### Run the Desktop Agent
```bash
cd desktop
npm run tauri dev      # development
npm run tauri build    # production binary
```

### Run Backend Tests
```bash
cd backend
npm run test           # unit tests
npm run test:e2e       # end-to-end tests
npm run test:cov       # coverage
```

## 🐳 Running with Docker

The repository currently ships a **fallback `Dockerfile`** (`alpine:latest` with an echo command) and a `.dockerignore` that already excludes `.env`, `node_modules`-style build artifacts, `dist/`, and virtualenvs. To actually run the services in containers, use the Dockerfiles below.

### Backend (`backend/Dockerfile`)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
```

### AI Engine (`ai-service/Dockerfile`)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn pandas scikit-learn numpy pydantic
COPY main.py .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build & run individually
```bash
# Backend
docker build -t sentinel-backend ./backend
docker run -p 3000:3000 sentinel-backend

# AI Engine
docker build -t sentinel-ai ./ai-service
docker run -p 8000:8000 sentinel-ai
```

### Recommended `docker-compose.yml` (place at repo root)
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - PORT=3000

  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
```

Then, on any laptop or server:
```bash
docker compose up --build
```
This starts the tracking backend on `:3000` and the anomaly-detection engine on `:8000`. *(The Tauri desktop agent is a native binary and is not containerized — it must run on the host OS to access the webcam and lock screen APIs.)*

## 🔍 Workability Assessment

In the interest of full transparency, here is an honest evaluation of the current state of the codebase:

**What works today:**
- ✅ The NestJS backend **compiles and runs**; the Socket.IO gateway correctly handles `updateLocation` / `triggerAlarm` and broadcasts events. Unit and e2e test scaffolding exists and passes.
- ✅ The FastAPI AI engine **runs and responds**; the IsolationForest anomaly-detection flow is functional as a proof of concept.
- ✅ The Rust desktop agent **compiles** and its remote-lock commands call real OS APIs on Windows/macOS.

**What is incomplete / NOT production-ready:**
- ⚠️ **No persistence.** Location history lives in an in-memory Python list and the backend stores nothing — all data is lost on restart. A database (e.g., PostgreSQL/MongoDB) is required.
- ⚠️ **No authentication or authorization.** The WebSocket gateway has `cors: true` wide open and no device identity verification; anyone can emit `triggerAlarm` for any `deviceId`. This is a critical security gap for an anti-theft product.
- ⚠️ **The backend and AI engine are not wired together.** The gateway contains only a comment (`// Here we would also push this to the AI anomaly detection engine`); no HTTP call to `/analyze` is implemented.
- ⚠️ **The AI model is naive.** It re-fits on only the last 10 points per request, uses a single global in-memory history shared across *all* devices (no per-device isolation), and ignores time/velocity features. The code comments themselves acknowledge this.
- ⚠️ **Silent camera capture is a stub.** `capture_intruder_selfie` returns a success string but captures nothing (pseudocode only).
- ⚠️ **The background daemon doesn't listen to anything.** The Rust setup spawns a thread that prints a message but never connects to the backend via WebSocket/MQTT, so remote commands cannot actually reach the agent yet.
- ⚠️ **No mobile apps.** Android/iOS clients are advertised but not present in this repository.
- ⚠️ **Docker support is skeletal.** The root `Dockerfile` is a placeholder (`echo 'Default fallback Dockerfile'`); the working Dockerfiles above must be added.
- ⚠️ **Empty `requirements.txt`** and no root-level orchestration (`docker-compose.yml`) committed.

**Verdict:** This is a **promising, well-structured architectural skeleton / MVP prototype** — a solid foundation demonstrating the intended design — but it is **not production-ready**. Reaching production requires, at minimum: authentication & device attestation, persistent storage, backend↔AI integration, real webcam capture, a functional command listener in the desktop agent, per-device ML state, and mobile clients.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page. Please note that by contributing, you agree your contributions fall under the project's custom license terms below.

## 📝 License

This project is **not** MIT-licensed. It is distributed under the **VisionQuantech Custom Commercial License** (see [`LICENSE`](./LICENSE)):

1. **Non-financial / non-earning use** (personal, educational) — **free**.
2. **Personal earning use** — requires sharing **15%–30% of gross earnings** derived from the Software.
3. **Business / enterprise use** — **prohibited** without a separate commercial license. Contact: **visionquantech@proton.me**

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. See the `LICENSE` file for full terms.

---

**Disclaimer:** This software is intended for protecting devices you own. Ensure compliance with local laws regarding device tracking, remote locking, and camera capture before deployment.