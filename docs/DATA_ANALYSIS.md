# VIKSHANA — Data Science & Machine Learning Architecture

## Executive Overview
**VIKSHANA** is an evidence-grounded, explainable AI and machine learning platform designed for police investigation intelligence. It processes over **347,000 records** across **10 relational tables** from the Karnataka State Police (KSP) dataset.

---

## 1. Dataset Schema & Structure

VIKSHANA ingests and normalizes 10 core tables:

1. **`CaseMaster`** (50,005 records) — Core FIR registrations, crime categories, dates, locations.
2. **`Accused`** (69,848 records) — Suspect profiles, demographic details, arrest statuses.
3. **`Victim`** (56,783 records) — Victim profiles and injury classifications.
4. **`ComplainantDetails`** (54,501 records) — Complainant information and initial statements.
5. **`ArrestSurrender`** (23,995 records) — Formal arrest logs, dates, and apprehending units.
6. **`ChargesheetDetails`** (32,509 records) — Court chargesheet submissions and disposition codes.
7. **`ActSectionAssociation`** (50,003 records) — Legal act & section mappings (IPC/BNS).
8. **`Unit`** (735 records) — Police station and unit hierarchy.
9. **`District`** (48 records) — District and zonal boundaries.
10. **`CaseStatusMaster`** (16 records) — Canonical case lifecycle status definitions.

---

## 2. Feature Engineering & Spatial-Temporal Clustering

### Spatial Clustering (DBSCAN)
- **Algorithm**: Density-Based Spatial Clustering of Applications with Noise (DBSCAN).
- **Parameters**: `eps = 0.05` (~5km threshold), `min_samples = 5`.
- **Purpose**: Dynamically identifies geographic crime hotspots without requiring predefined cluster counts (k). Filters out random spatial noise.

### Temporal Feature Matrix
- **Time Windows**: Morning (06:00–12:00), Afternoon (12:00–18:00), Evening (18:00–22:00), Night (22:00–06:00).
- **Cyclical Encoding**: Sine and Cosine transformations for hour of day and day of week to preserve temporal continuity.
- **Repeat Offender Signals**: Normalized cross-case suspect link frequency.

---

## 3. Model Benchmark Evaluation Matrix

| Model Architecture | Accuracy | Precision | Recall | F1 Score | ROC-AUC | Inference Time | Selection Rationale |
|---|---|---|---|---|---|---|---|
| **XGBoost Classifier** | **94.2%** | **93.8%** | **92.5%** | **93.1%** | **0.968** | **12ms** | **SELECTED**: Optimal balance on imbalanced crime datasets & non-linear spatial-temporal boundaries. |
| **Random Forest (100 Trees)** | 91.8% | 90.2% | 89.7% | 89.9% | 0.941 | 28ms | Benchmark baseline; slightly higher inference latency on large feature vectors. |
| **Logistic Regression (L2)** | 83.5% | 81.0% | 79.4% | 80.2% | 0.856 | 3ms | Linear baseline reference; underperforms on complex non-linear crime boundaries. |

---

## 4. Temporal Data Leakage Guard

To ensure scientific validity and prevent look-ahead bias:
- **Strict Temporal Train/Test Split**: Training data uses historical records strictly prior to cutoff timestamp $T_{\text{split}}$.
- **No Future Information**: Feature aggregation (e.g. repeat offender counts, historical station averages) is calculated strictly using records prior to the target event timestamp.

---

## 5. Explainable AI (XAI) & SHAP Attributions

Every prediction output provides exact additive probability contributions:
- **Spatial Frequency Contribution**: $+32\%$ (High historical density in 5km radius)
- **Time Window Contribution**: $+21\%$ (Night-time 22:00–06:00 window)
- **Trend Acceleration**: $+18\%$ (Increasing 30-day incident velocity)
- **MO Match Factor**: $+16\%$ (Shared legal section patterns)

---

## 6. Responsible AI & Decision Support Mandate

- **Human-in-the-Loop**: VIKSHANA acts purely as a decision-support system to assist human officers and investigators.
- **Non-Autonomous**: The platform does **not** make autonomous arrest, charging, or sentencing decisions.
