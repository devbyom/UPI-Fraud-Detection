# UPI Fraud Detection Using Machine Learning

> **Om Anand** &nbsp;|&nbsp; B.Tech CSE &nbsp;|&nbsp; AKTU &nbsp;|&nbsp; ML Project

Real-time UPI transaction fraud detection using an ensemble of ML models with a modern web dashboard.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| ML Models | XGBoost · LightGBM · Random Forest · Isolation Forest · GNN-Transformer |
| Backend | Python · FastAPI |
| Frontend | HTML5 · CSS3 · JavaScript (ES6+) |
| Extras | Federated Learning · Blockchain Audit · Kafka Streaming |

## Features

- **Real-time Fraud Detection** — sub-100 ms predictions via ensemble voting  
- **Interactive Dashboard** — live transaction feed, KPI metrics, model performance charts  
- **Transaction Analyzer** — submit any UPI transaction for instant risk scoring  
- **ML Model Manager** — monitor, retrain, and deploy models from the UI  
- **Security Alerts** — real-time threat intelligence and alert management  
- **Demo Mode** — fully functional UI even without the backend running  

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start backend API
python simple_backend_api.py

# 3. Open frontend
cd frontend
python server.py          # serves on http://localhost:5500
# OR just open index.html directly in your browser
```

## Project Structure

```
├── frontend/              ← Web UI (index.html · styles.css · script.js)
├── models/                ← Pre-trained ML model files (.pkl)
├── serving/               ← FastAPI inference server
├── streaming/             ← Kafka + Spark real-time pipeline
├── infra/                 ← Docker · Kubernetes configs
└── docs/                  ← Architecture diagrams
```

## Model Performance

| Model | Accuracy | Precision | Recall |
|---|---|---|---|
| Advanced Ensemble | **98.7%** | 96.2% | 94.8% |
| GNN-Transformer | 97.3% | 95.1% | 93.7% |
| XGBoost | 94.0% | — | — |
| LightGBM | 92.0% | — | — |
| Random Forest | 89.0% | — | — |

## Frontend Demo Mode

The frontend works **without the backend**. All features simulate realistic data automatically — useful for presentations and demos.

---

**Developer:** Om Anand  
**University:** Dr. A.P.J. Abdul Kalam Technical University (AKTU)  
**Branch:** B.Tech — Computer Science & Engineering  
**Subject:** Machine Learning Project  
