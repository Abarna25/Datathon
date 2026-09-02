# Data Provenance & Dataset Transparency

This document details the data sources, demonstration datasets, and data governance policies for the **VIKSHANA / Datathon** Intelligent Crime Analytics Platform.

---

## 1. Core Primary Dataset

- **Source**: Karnataka State Police (KSP) Crime Datastore.
- **Tables**: `CaseMaster`, `Victim`, `Accused`, `ComplainantDetails`, `ArrestSurrender`, `ChargesheetDetails`, `ActSectionAssociation`, `Court`, `Unit`.
- **Type**: Verified Official Law Enforcement Dataset.
- **Coverage**: District-level and Unit-level incident records.

---

## 2. Demonstration & External Intelligence Datasets

Per strict data transparency guidelines, external socio-economic and financial transaction data are provided as clearly labeled demonstration datasets.

### A. Socio-Economic Demo Dataset (`demo_socioeconomic_data.csv`)
- **Label**: `DEMONSTRATION DATA — FOR PROTOTYPE ANALYTICS ONLY`
- **Fields**: `district`, `total_population`, `population_density_sq_km`, `literacy_rate_pct`, `employment_rate_pct`, `unemployment_rate_pct`, `urban_pop_pct`, `rural_pop_pct`, `last_updated`, `data_source`.
- **Purpose**: Provides an external demographic layer to model district-level socio-economic indicators and calculate Pearson/Spearman statistical correlations against incident density.

### B. Financial Transactions Demo Dataset (`financial_transactions_demo.csv`)
- **Label**: `SIMULATED FINANCIAL DATA — FOR DEMONSTRATION PURPOSES ONLY`
- **Fields**: `transaction_id`, `from_account`, `to_account`, `amount`, `timestamp`, `transaction_type`, `location`, `linked_case_id`, `risk_flag`, `data_source`.
- **Purpose**: Demonstrates multi-hop money trail analysis, circular transaction detection, and transaction pattern risk scoring.
- **Notice**: Uses synthetic identifiers (`ACC_DEMO_001`, `ACC_DEMO_002`). No real bank account or financial records are used.

---

## 3. Data Governance & Responsible AI Rules

1. **Correlation ≠ Causation**:
   - All correlation analyses explicitly state: *"Statistical correlation does not establish causation."*
2. **No Protected Group Profiling**:
   - Social risk indices operate exclusively on geographic district aggregates.
   - Religion, caste, ethnicity, and protected groups are NEVER profiled.
3. **Neutral Network Labeling**:
   - Criminal relationship graph clusters use neutral labels (`High-Connectivity Cluster`, `Potential Association Network`) rather than subjective gang or syndicate labels.
4. **Deterministic & Explainable Analytics**:
   - All intelligence scores include evidence grounds, methodology descriptions, confidence ratings, and explicit dataset limitation disclaimers.
