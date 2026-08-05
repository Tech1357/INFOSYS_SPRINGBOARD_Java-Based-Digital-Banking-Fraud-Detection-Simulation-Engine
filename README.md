# 🛡️ SecurePay Fraud Detection System

### Rule-Based + Machine Learning Powered Transaction Monitoring Platform

---

## 📌 Project Overview

SecurePay is a **full-stack fraud detection system** designed to simulate real-world banking transactions and identify fraudulent activities using a **Hybrid Detection Engine**.

The system combines:

* ⚙️ **Rule-Based Fraud Detection (Spring Boot)**
* 🧠 **Machine Learning Prediction (Python FastAPI)**

It provides a **real-time monitoring dashboard** for administrators and analysts to:

* Track transactions
* Detect fraud
* Analyze patterns
* Respond to alerts

---

## 🚀 Key Features

### 🔐 Authentication & Security

* Role-Based Access Control (Admin / Analyst)
* Secure login system
* JWT-based authentication
* Password encryption (BCrypt)

---

### 💳 Transaction Management

* Real-time transaction generation
* Transaction history tracking
* Detailed transaction inspection (modal view)
* Status classification:

  * Safe
  * Medium Risk
  * High Risk

---

### 🚨 Fraud Detection Engine

#### Rule-Based Detection

* High transaction amount
* Rapid transaction velocity
* Suspicious location patterns
* Abnormal activity timing
* Risk thresholds

#### Machine Learning Detection

* Random Forest Classifier
* Behavioral pattern recognition
* Integrated via FastAPI
* Combined scoring with rules engine

---

### 🔔 Fraud Alerts System

* Real-time fraud alerts
* Alert severity classification
* Email + in-app notifications
* Alert resolution workflow

---

### 📊 Analytics Dashboard

* Fraud vs Safe transaction trends
* Model performance metrics:

  * Accuracy
  * Precision
  * Recall
  * AUC Score
* Risk distribution charts
* Fraud trend analysis

---

### 🗺️ Fraud Location Analytics

* Interactive fraud map
* Geo-location based detection
* Risk intensity visualization

---

### 💬 Communication Module

* Analyst → Admin request system
* Query resolution workflow
* Notification-based communication

---

### 📡 System Monitoring (Telemetry)

* API response time tracking
* CPU load monitoring
* System uptime
* Backend performance insights

---

### 📁 Audit Logging

* Tracks all user actions
* Export logs (CSV/PDF)
* System transparency

---

## 🏗️ System Architecture

```
┌──────────────────────────┐
│   React Frontend         │  (Port 5173)
│   Interactive Dashboard  │
└────────────┬─────────────┘
             │ Axios REST API
             ▼
┌──────────────────────────┐
│   Spring Boot Backend    │  (Port 8082)
│   - Authentication       │
│   - Rule Engine          │
│   - Database (MySQL)     │
└────────────┬─────────────┘
             │ REST API Call
             ▼
┌──────────────────────────┐
│   Python ML Service      │  (Port 8000)
│   - Random Forest Model  │
│   - /predict API         │
└──────────────────────────┘
```

---

## 🧰 Tech Stack

### 🎨 Frontend

* React (Vite)
* TailwindCSS
* Recharts
* Leaflet (Maps)

### ⚙️ Backend

* Java 17
* Spring Boot 3
* Spring Data JPA
* MySQL

### 🧠 Machine Learning

* Python
* FastAPI
* Pandas & NumPy
* Scikit-learn
* Joblib

---

## 📂 Project Structure

```
DigitalBanking/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TransactionList.jsx
│   │   │   ├── FraudMap.jsx
│   │   │   ├── MLInsights.jsx
│   │   │   ├── SystemStatus.jsx
│   │   │   ├── AuditLog.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── ...
│   │   ├── App.jsx
│   │   └── main.jsx
│
├── java-backend/
│   └── frauddetection/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── model/
│       ├── FrauddetectionApplication.java
│       └── pom.xml
│
├── ml-service/
│   ├── fraud_api.py
│   ├── fraud_dataset_250k.csv
│   ├── fraud_test_model.pkl
│   └── fraudTest.py
│
├── database/
└── license.txt
```

---

## ▶️ How to Run the Project

### 1️⃣ Database Setup (MySQL)

* Create database: `frauddb`
* Update credentials in `application.properties`

---

### 2️⃣ Run ML Service

```bash
cd ml-service
pip install fastapi uvicorn pandas joblib scikit-learn
python fraud_api.py
```

👉 Runs on: `http://localhost:8000`

---

### 3️⃣ Run Backend

```bash
cd java-backend/frauddetection/frauddetection
./mvnw spring-boot:run
```

👉 Runs on: `http://localhost:8082`

---

### 4️⃣ Run Frontend

```bash
cd frontend
npm install
npm run dev
```

👉 Runs on: `http://localhost:5173`

---

## 🔗 Important API Endpoints

### Authentication

* POST `/api/auth/login`
* POST `/api/auth/register`

### Transactions

* GET `/api/transactions`
* POST `/api/predict`

### Communication

* POST `/api/contacts`

---

## 🤖 Machine Learning Details

* Model: **Random Forest Classifier**
* Dataset Size: **250,000 transactions**

### Features Used:

* Transaction Amount
* Latitude & Longitude
* Transaction Time
* Population Data

---

## 🔄 Integration Flow

1. Frontend sends transaction
2. Backend stores in MySQL
3. Backend calls ML API
4. ML returns fraud score
5. UI displays risk (Safe / Medium / High)

---

## ⚠️ Limitations

* Uses synthetic dataset
* No real banking integration
* Alerts use polling (no WebSockets yet)

---

## 🌟 Future Enhancements

* Real-time alerts (WebSockets)
* Docker deployment
* Cloud hosting (AWS/Azure)
* Auto model retraining
* Multi-Factor Authentication

---


## 📜 License

This project follows the terms defined in `license.txt`.

---
*Updated on March 28, 2026*
⭐ *Developed for Digital Banking Fraud Detection & Simulation Engine*

