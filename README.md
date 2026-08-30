<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status" />
  <img src="https://img.shields.io/badge/Platform-Zoho%20Catalyst-blue.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Frontend-React.js-61DAFB.svg" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933.svg" alt="Node" />
  <img src="https://img.shields.io/badge/AI-Generative%20Intelligence-purple.svg" alt="AI" />
  
  <br />
  <br />
  <h1>👁️ VIKSHANA</h1>
  <p><strong>Advanced Agentic Policing & Predictive Intelligence Platform</strong></p>
  <p><i>The Future of Law Enforcement Analytics.</i></p>
</div>

---

## 📌 Overview
**VIKSHANA** is an enterprise-grade, AI-driven policing and forensic intelligence platform. Designed to bridge the gap between traditional law enforcement methodologies and next-generation artificial intelligence, VIKSHANA transforms fragmented case data into actionable, predictive, and holistic intelligence. 

By integrating multi-agent reasoning, deep graph traversal, and proactive sociological profiling, VIKSHANA empowers investigators to solve cases faster, anticipate emerging crime patterns, and implement systemic interventions.

---

## 🚀 Key Features

### 🔍 1. Master Investigation Workspace
A unified dashboard for comprehensive case management. Move seamlessly from raw FIR reading to automated timeline extraction, suspect correlation, and decision support—all in one integrated environment.

### 🧠 2. Evidence Intelligence & Copilot
Interact directly with your case data through the **VIKSHANA Copilot**. Backed by a strict **Hallucination Guard**, the Copilot guarantees that every AI-generated summary, timeline, and gap analysis is verifiably grounded in the actual evidence ledger.

### 🕸️ 3. Relationship Explorer (Graph Analytics)
Visualize complex criminal networks. Map relationships between suspects, victims, organizations, and overlapping case histories. Uncover hidden syndicates through automated node traversals.

### 🔮 4. Predictive Crime Forecasting
Leverage historical data to map and forecast crime hotspots. Implement proactive policing through localized deployment recommendations and temporal crime pattern modeling.

### 👥 5. Sociological Intelligence Hub
Go beyond the crime. The Sociological Assistant analyzes the socio-economic, behavioral, and environmental catalysts behind offenses, generating community-level policy recommendations and rehabilitation strategies.

### 🛡️ 6. Robust Role-Based Access Control (RBAC)
Enterprise-ready security ensuring that Investigators, Analysts, Supervisors, and Policymakers only see the data and intelligence modules relevant to their clearance levels.

---

## 🏗️ System Architecture

VIKSHANA is built entirely on the **Zoho Catalyst** ecosystem for scalable, serverless execution.

- **Frontend:** React.js (Component-driven architecture, Glassmorphism UI, Responsive Dashboarding).
- **Backend (Advanced I/O):** Node.js Advanced Serverless Functions handling multi-agent orchestration, robust parsing utilities, and deterministic validation.
- **Data Layer:** Catalyst Datastore & Catalyst Cache for high-speed ledger retrieval and session state management.
- **AI Layer:** Secure integrations with large-context LLMs, utilizing `StructuredAIResponseParser` and proprietary system prompts to enforce JSON structured outputs and prevent truncation failure modes.

---

## 🛠️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16+ recommended)
- [Zoho Catalyst CLI](https://docs.catalyst.zoho.com/en/cli/v1/install/)

### Local Development

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/KANISH-850/Vikshana.git
   cd Vikshana
   \`\`\`

2. **Install Frontend Dependencies:**
   \`\`\`bash
   cd react-app
   npm install
   \`\`\`

3. **Install Backend Dependencies:**
   \`\`\`bash
   cd ../functions/vikshana_function
   npm install
   \`\`\`

4. **Serve the Application:**
   Return to the root directory and start the Catalyst local environment.
   \`\`\`bash
   cd ../..
   catalyst serve
   \`\`\`
   *The client application will typically run at `http://localhost:3000/app/`.*

---

## 🛡️ Security & AI Reliability
VIKSHANA takes AI safety seriously in law enforcement contexts.
- **Zero Hallucination Tolerance:** The bespoke `HallucinationGuardService` intercepts LLM responses and strictly cross-references generated Names, Dates, Entities, and common crime tropes against the raw Datastore context.
- **Fail-Safe Generation:** Implements intelligent response parsers with automatic 1-time retry loops for malformed JSON or provider token limit hits.

---

## 📜 License
*Proprietary. Developed specifically for Datathon / Hackathon purposes.*

---
<div align="center">
  <i>Built with ❤️ for a safer tomorrow.</i>
</div>
