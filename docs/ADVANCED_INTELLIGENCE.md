# Advanced Crime Intelligence Architecture

This document describes the architectural enhancements added to the **VIKSHANA / Datathon** platform to deliver high-compliance, explainable crime intelligence capabilities.

---

## Architecture Overview

```text
SEASONAL INTELLIGENCE
        +
SOCIO-ECONOMIC INTELLIGENCE
        +
SOCIAL RISK CORRELATION
        +
COMMUNITY DETECTION
        +
FINANCIAL INTELLIGENCE
        ↓
ADVANCED PROACTIVE CRIME INTELLIGENCE
```

---

## 1. Seasonal & Event Crime Intelligence
- **Backend Service**: `SeasonalEventIntelligenceService.js`
- **Controller**: `SeasonalIntelligenceController.js`
- **API Endpoint**: `GET /intelligence/forecast/seasonal`
- **Capabilities**:
  - Month-wise crime trends (Jan-Dec counts, MoM %, top crime types, historical averages).
  - Day-of-week crime frequency (Mon-Sun risk days).
  - Time-of-day crime distribution.
  - Karnataka Event Window baseline deviation analysis (New Year, Ugadi, Dasara, Deepavali, Ganesh Chaturthi, Eid, etc.).

---

## 2. Socio-Economic Intelligence Layer
- **Backend Data Provider**: `SocioEconomicDataProvider.js`
- **API Endpoint**: `GET /intelligence/sociological/socioeconomic`
- **Capabilities**:
  - Data provider abstraction for external demographic indicators (population density, literacy, employment, urbanization).
  - Data quality validation, percentage normalization, missing district handling, and transparency metadata.

---

## 3. Social Risk Correlation Engine
- **Backend Service**: `SocialRiskCorrelationService.js`
- **Controller**: `SocialRiskController.js`
- **API Endpoint**: `GET /intelligence/sociological/correlation`
- **Capabilities**:
  - Pearson and Spearman rank correlation between socio-economic indicators and reported incident density.
  - Explainable Social Risk Index breakdown per district (Population Pressure, Urbanization, Employment, Education, Crime Pattern).
  - Responsible AI enforcement operating strictly on geographic district statistics.

---

## 4. Criminal Network Community Detection
- **Backend Service**: `CommunityDetectionService.js`
- **Controller**: `CommunityDetectionController.js`
- **API Endpoint**: `GET /relationships/communities`
- **Capabilities**:
  - Louvain modularity & Connected Components clustering on entity relationship graphs.
  - Identification of cluster metrics, central nodes, connection density, and explainability summaries using neutral terms (`High-Connectivity Cluster`, `Potential Association Network`).

---

## 5. Financial Intelligence Module
- **Backend Service**: `FinancialIntelligenceService.js`
- **API Endpoints**:
  - `GET /forensics/financial/overview`
  - `GET /forensics/financial/money-trail`
  - `GET /forensics/financial/suspicious-patterns`
- **Capabilities**:
  - Multi-hop Money Trail Analysis (`Account A → B → C → D`).
  - Detection of rapid transfers, circular transactions (`A → B → C → A`), and high-value transfers.
  - Explainable Transaction Pattern Risk Scoring (0–100).
  - Prominent synthetic data transparency banners.
