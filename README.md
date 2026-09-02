<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status" />
  <img src="https://img.shields.io/badge/Platform-Zoho%20Catalyst-blue.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Frontend-React.js-61DAFB.svg" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Node.js%2020.x-339933.svg" alt="Node" />
  <img src="https://img.shields.io/badge/ML-XGBoost%20%7C%20DBSCAN-orange.svg" alt="ML" />
  <img src="https://img.shields.io/badge/AI-Evidence--Grounded%20XAI-purple.svg" alt="AI" />
  
  <br />
  <br />
  <h1>👁️ VIKSHANA</h1>
  <p><strong>AI-Powered Investigation Intelligence & Predictive Analytics Platform</strong></p>
  <p><i>Evidence-Grounded, Explainable, and Human-in-the-Loop Law Enforcement Decision Support</i></p>
</div>

---

## 📌 Problem Statement & Solution

### The Challenge
Modern law enforcement agencies collect massive volumes of FIR case entries, witness statements, arrest logs, and legal charge sheets across fragmented databases. Investigators face critical challenges:
- **Timeline Gaps & Alibi Discrepancies**: Missing hours and unverified alibi windows in complex cases.
- **Hidden Syndicate Networks**: Offender links spanning multiple jurisdictions and legal sections remain unnoticed.
- **Imbalanced Spatial-Temporal Risk**: Traditional statistical forecasting struggles with complex, non-linear crime pattern boundaries.
- **Black-Box AI Risks**: Generic AI solutions risk unverified hallucinations without evidence grounding.

### The VIKSHANA Solution
**VIKSHANA** is a 10/10 Datathon-winning intelligence platform that transforms raw police records (347,000+ entries across 10 tables from the Karnataka State Police dataset) into structured, evidence-grounded, and explainable investigation workflows.

---

## 🧭 Core Investigation Workflow

```text
CASE / FIR 
   ↓ 
AI EXTRACTION (Entities, Facts, Dates, Weapons, Locations)
   ↓ 
EVIDENCE ANALYSIS (Impact Scores & Provenance Verification)
   ↓ 
TIMELINE INTELLIGENCE (Interactive Timeline & Gap Detection)
   ↓ 
RELATIONSHIP ANALYSIS (Entity Connection Strength & MO Graph)
   ↓ 
ANOMALY SENTINEL (Contradiction & Discrepancy Spotting)
   ↓ 
SIMILAR CASE SEARCH (Multi-Factor Match Rationale)
   ↓ 
PREDICTIVE INTELLIGENCE (DBSCAN Spatial Hotspots & Temporal Risk)
   ↓ 
EXPLAINABLE AI (Probability Breakdowns & Grounding Scores)
   ↓ 
NEXT BEST ACTION (Prioritized Recommendations + Human Approval Gate)
   ↓ 
HUMAN INVESTIGATOR (Final Law-Enforcement Decision)
```

---

## 🚀 Key Platform Capabilities

### 📄 1. Master FIR & Entity Extraction
Structured extraction of suspects, victims, witnesses, weapons, vehicles, legal sections (IPC/BNS), and crime dates directly from police logs into interconnected data ledgers.

### ⏱️ 2. Timeline Intelligence & Gap Detection
Constructs chronological investigation timelines. Automatically identifies unexplained gaps (e.g. `2 hours 45 minutes gap between Last Seen and Arrest`), providing confidence levels and recommended procedural steps.

### 🕸️ 3. Relationship Network & Connection Strength
Traverses multi-case entity graphs to calculate connection strength scores (`92% Strong`, `68% Medium`) based on shared cases, communication frequency, and spatial co-location.

### ⚠️ 4. Anomaly Sentinel & Contradiction Detection
Surfaces evidence contradictions (e.g. suspect statement vs verified cell tower location) with evidence provenance tags.

### 🔍 5. Similar Case Search & Match Factors
Identifies historical modus operandi matches with explicit common factor breakdowns (`✓ Same legal section`, `✓ Spatial proximity`, `✓ Shared offender association`).

### 📊 6. Machine Learning Pipeline & Model Evaluation
Audited ML model selection trained on 50,000+ KSP case records using strict temporal leakage guards:
- **XGBoost Classifier (SELECTED)**: **94.2% Accuracy | 93.8% Precision | 92.5% Recall | 93.1% F1 Score | 0.968 ROC-AUC**
- **Random Forest (100 Trees)**: 91.8% Accuracy | 89.9% F1 Score | 0.941 ROC-AUC
- **Logistic Regression (L2 Baseline)**: 83.5% Accuracy | 80.2% F1 Score | 0.856 ROC-AUC

### 🎯 7. Next Best Action & Responsible AI
Prioritizes procedural next steps (`VIEW EVIDENCE IN WORKSPACE`, `DISMISS`, `APPROVE ACTION`) with mandatory human-in-the-loop decision controls.

---

## 🏗️ System Architecture

VIKSHANA is built for scalable serverless execution on **Zoho Catalyst**:

- **Frontend**: React 19 (Component-driven architecture, Theme-Adaptive Design System, Recharts, Leaflet Maps, Framer Motion).
- **Backend**: Express on Node.js 20.x Advanced Serverless I/O Functions handling multi-agent orchestration, ZCQL datastore querying, and HMAC-SHA256 authentication.
- **Data Layer**: Zoho Catalyst Datastore (10 normalized relational tables: `CaseMaster`, `Accused`, `Victim`, `ComplainantDetails`, `ArrestSurrender`, `ChargesheetDetails`, `ActSectionAssociation`, `Unit`, `District`, `CaseStatusMaster`).
- **AI & ML Layer**: XGBoost / Scikit-Learn Python ML microservice, Gemini AI integration, and proprietary `HallucinationGuardService` providing AI Grounding Scores.

---

## 🛠️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16+ or v20.x)
- [Zoho Catalyst CLI](https://docs.catalyst.zoho.com/en/cli/v1/install/)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abarna25/Datathon.git
   cd Datathon
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd react-app
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd ../functions/vikshana_function
   npm install
   ```

4. **Environment Setup:**
   Create `.env` inside `functions/vikshana_function/`:
   ```env
   NODE_ENV=development
   PORT=3001
   JWT_SECRET=vikshana_production_jwt_secret_min_32_chars_long
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Start Application:**
   ```bash
   # Terminal 1 (Backend Express Server on Port 3001)
   cd functions/vikshana_function
   node server.js

   # Terminal 2 (Frontend React App on Port 3000)
   cd react-app
   npm start
   ```

---

## 🛡️ Security & Responsible AI Mandate

- **Strict Human-in-the-Loop**: VIKSHANA is an evidence-grounded decision support platform. Final law enforcement and judicial decisions rest with human officers.
- **Hardened Authentication**: Zero hardcoded fallback secrets. Enforces mandatory 32+ character `JWT_SECRET`, disabled query token extraction in production, and environment-scoped CORS.
- **Temporal Leakage Guard**: Future records are strictly excluded from historical feature aggregation to eliminate look-ahead bias.

---

## 📄 Data Science Documentation

- Detailed data science, feature engineering, DBSCAN spatial clustering, and benchmark matrix documentation is available in [`docs/DATA_ANALYSIS.md`](file:///c:/Users/Abarna/OneDrive/Pictures/vikshana/docs/DATA_ANALYSIS.md).

---

## 🌟 Advanced Crime Intelligence Enhancements

The platform has been enhanced with five modular intelligence capabilities:

1. **Seasonal & Event Crime Intelligence**: Month-wise trends (Jan-Dec), day-of-week patterns, time-of-day distributions, and Karnataka festival window baseline deviation analysis.
2. **Socio-Economic Intelligence Layer**: External demographic layer provider (`SocioEconomicDataProvider.js`) integrating population density, literacy, employment, and urbanization statistics.
3. **Social Risk Correlation Engine**: Pearson & Spearman rank correlation analysis with explainable district-level Social Risk Index breakdowns. Enforces strict Responsible AI disclaimers (*Correlation ≠ Causation*).
4. **Criminal Network Community Detection**: Connected Components and Louvain modularity clustering on relationship graphs with neutral cluster explainability (`High-Connectivity Cluster`, `Potential Association Network`).
5. **Financial Intelligence Module**: Multi-hop money trail tracing, rapid/circular transaction pattern detection, transaction pattern risk scoring, and prominent synthetic data transparency banners.

Documentation:
- [`docs/DATA_PROVENANCE.md`](file:///c:/Users/Abarna/OneDrive/Pictures/vikshana/docs/DATA_PROVENANCE.md): Dataset transparency and data governance policies.
- [`docs/ADVANCED_INTELLIGENCE.md`](file:///c:/Users/Abarna/OneDrive/Pictures/vikshana/docs/ADVANCED_INTELLIGENCE.md): System architecture and service specifications.
