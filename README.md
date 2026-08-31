# Sentinel Anti-Theft System

Sentinel is a production-grade, omni-platform anti-theft and location-tracking system. It features advanced background anomaly detection, hardware-level locking, and silent camera captures across all major operating systems.

## System Architecture

The architecture consists of a massive monorepo bridging 5 distinct platforms:

### 1. Backend API (NestJS)
A robust TypeScript backend utilizing WebSockets (`TrackingGateway`) to stream live location coordinates, hardware status, and encrypted E2E payloads between devices.

### 2. Mobile App (React Native - Android & iOS)
- **Android Native (`FakeShutdownService.java`)**: Overrides accessibility services to fake a power-off screen, keeping the device alive while silently capturing background photos via `IntruderCameraModule.java` and streaming coordinates.
- **iOS Native (`LocationTrackingModule.swift`)**: Utilizes Apple's `CLLocationManager` to enforce persistent background location tracking and E2EE telemetry.

### 3. Desktop Daemon (Tauri / Rust - Windows & macOS)
An invisible background daemon built in Rust. It listens for remote lock commands from the backend:
- **Windows**: Invokes `user32.dll` to instantly lock the workstation natively.
- **macOS**: Invokes `pmset displaysleepnow` to instantly sleep and lock MacBooks.

### 4. AI Threat Engine (Python / FastAPI)
A decoupled microservice utilizing a Scikit-Learn `IsolationForest` model. It ingests the telemetry data in real-time to detect anomalous behavioral patterns, alerting the user to potential theft events before they are realized.

### 5. Web Dashboard (Next.js)
A sleek React dashboard to view live tracking data, lock devices remotely, and receive intruder selfie alerts.

## Omni-Platform CI/CD
This repository is equipped with an automated GitHub Actions pipeline (`.github/workflows/build-all-platforms.yml`). 
Upon pushing to `main`, cloud servers will automatically compile the architecture into the following release binaries:
- **`.apk`** (Android)
- **`.exe`** (Windows)
- **`.dmg`** (macOS)
- **`.ipa`** (iOS)

---
*Built with React Native, Tauri, Next.js, NestJS, and Python FastAPI.*
