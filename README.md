# 🕵️‍♂️ VIKSHANA

> **AI-Powered Investigation Intelligence Platform**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Zoho Catalyst](https://img.shields.io/badge/Zoho_Catalyst-4353FF?style=for-the-badge&logo=zoho&logoColor=white)
![QuickML GLM](https://img.shields.io/badge/QuickML_GLM-000000?style=for-the-badge&logo=google&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Datathon](https://img.shields.io/badge/Datathon-Hackathon-FF4B4B?style=for-the-badge)

---

## 📖 Overview

**What problem VIKSHANA solves:**  
Law enforcement agencies often struggle with data silos, unstructured case files, and time-consuming manual processes when trying to connect evidence across different cases. Extracting actionable insights from hundreds of pages of FIR (First Information Report) narratives or interrogations takes days of manual effort.

**Why AI-assisted investigation matters:**  
By leveraging advanced AI and Large Language Models, investigators can process vast amounts of unstructured data instantly. AI can automatically identify suspects, vehicles, and evidence, resolve aliases, and draw connections that a human might miss—turning hours of reading into seconds of querying.

**Main objectives:**  
- Accelerate the investigation process using an AI-powered conversational interface.
- Provide interactive visual relationship mapping of entities (Suspects, Victims, Evidence).
- Automate the parsing and summarization of complex FIR narratives.
- Offer data-backed decision support and automated, formatted report generation.

---

## ✨ Key Features

- **✓ AI Investigation Chat:** A conversational Copilot interface for querying case details and receiving contextual answers.
- **✓ Investigation Workspace:** A unified hub displaying case details, timelines, and connected entities.
- **✓ Dashboard:** High-level overview of active cases, recent evidence, and alerts.
- **✓ Evidence Intelligence:** AI-driven analysis of physical, digital, and biological evidence.
- **✓ Relationship Explorer:** Maltego-style interactive nodal graph mapping connections between people, vehicles, and locations.
- **✓ FIR Narrative Understanding:** Automated extraction of entities, timelines, and investigation leads from unstructured FIR text.
- **✓ Text-to-SQL:** "Neural SQL Interface" that converts natural language questions into executable ZCQL database queries.
- **✓ Decision Support:** AI-recommended next steps and strategic analysis for the active case.
- **✓ AI Report Generation:** One-click generation of comprehensive investigation reports in Markdown/HTML.
- **✓ Context-Aware AI:** The LLM actively maintains the context of the currently selected case when answering queries.

*(Note: Features listed represent the current implementation state of the repository.)*

---

## 🏗️ Architecture

The platform follows a modern, decoupled architecture hosted entirely on the Zoho Catalyst serverless ecosystem.

**React Frontend** (SPA hosted on Catalyst Web Client Hosting)
↓
**Zoho Catalyst Advanced I/O** (API Gateway & Serverless Routing)
↓
**Node.js Backend** (Express.js powering `vikshana_function`)
↓
**Catalyst Data Store** (ZCQL Structured Database) & **QuickML GLM** (Large Language Models via API)

**Data Flow:**
1. The user interacts with the React frontend, sending natural language or UI-triggered requests.
2. The frontend communicates securely via authenticated Catalyst Advanced I/O endpoints.
3. The Node.js backend processes the request, orchestrating the AI Agents.
4. The backend pulls real-time structured data from the Catalyst Data Store.
5. The data is fed as context into the Zoho QuickML GLM model.
6. The AI synthesizes the response, which is routed back and rendered dynamically on the frontend.

---

## 💻 Technology Stack

- **Frontend:** React.js, Context API, Lucide React (Icons), Custom CSS
- **Backend:** Node.js, Express.js (Catalyst Advanced I/O Function)
- **Database:** Zoho Catalyst Data Store (ZCQL)
- **Authentication:** Zoho Catalyst Web SDK Authentication
- **AI / LLM:** Zoho Catalyst QuickML (GLM API) / Gemini AI Fallback
- **Deployment:** Zoho Catalyst Serverless Ecosystem
- **Visualization Libraries:** `react-force-graph-2d` (Entity Relationships)

---

## 📁 Project Structure

```text
VIKSHANA/
├── catalyst.json                # Catalyst project configuration
├── cleanup.bat                  # Local environment cleanup script
├── dataset/                     # Mock data CSVs for fallback logic
├── ml_pipeline/                 # Python-based ML training and evaluation scripts
├── react-app/                   # React Frontend
│   ├── src/
│   │   ├── auth/                # Catalyst authentication wrappers
│   │   ├── components/          # Reusable UI components (chat, fir, data explorer)
│   │   ├── context/             # React Context for global state (AppContext)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Main route views (Dashboard, Cases, Reports)
│   │   ├── services/            # API client configurations
│   │   └── styles/              # Global and scoped CSS styles
└── functions/
    └── vikshana_function/       # Node.js Advanced I/O Backend
        ├── agents/              # AI Orchestration Agents (Planner, Report, etc.)
        ├── controllers/         # Express Route Controllers
        ├── middleware/          # Express Middlewares
        ├── prompts/             # System instructions and prompt templates for GLM
        ├── queries/             # ZCQL Database queries and mock fallbacks
        ├── routes/              # Express API Route definitions
        └── services/            # Core business logic and LLM integrations
```

---

## 🖥️ Screens

1. **Dashboard:** High-level system overview.
2. **Cases:** Grid/List view of all active and archived investigations.
3. **Investigation Workspace:** The primary active case view with timelines and details.
4. **Relationship Explorer:** Visual graph mapping entities and their connections.
5. **Evidence Intelligence:** Detailed view of physical/digital case evidence.
6. **Decision Support:** AI-generated strategic advice for investigators.
7. **Reports:** Interface for generating and exporting case dockets.
8. **Audit Logs:** System-level auditing logs.

---

## 🧠 AI Workflow

**1. User Query:** The investigator asks a question via the chat or triggers an analysis button.
↓
**2. Context Builder:** The backend identifies the active case and fetches relevant structured data (Evidence, Suspects) from the Datastore.
↓
**3. Planner Agent:** Determines if the query requires multi-step reasoning or a direct answer.
↓
**4. Tool Executor:** Fetches any additional required data (e.g., executing a ZCQL query).
↓
**5. Catalyst Datastore:** Structured SQL/ZCQL data extraction.
↓
**6. QuickML GLM:** The assembled prompt (User Query + System Prompt + Structured Context) is sent to the LLM.
↓
**7. Response Formatter:** The backend parses the LLM output (Markdown, JSON, or Graph Data).
↓
**8. Frontend:** The React app renders the formatted response (Chat Bubble, Node Graph, or Report).

---

## 🚀 Deployment

**Local Development**
To run the project locally using the Catalyst CLI emulator:
```bash
catalyst serve
```
This will start both the React frontend and the Node.js backend on `localhost:3000`.

**Production**
To deploy the application to the Zoho Catalyst production environment:
```bash
catalyst deploy
```
*Note: The React application is built and hosted using Zoho Catalyst Web Client Hosting, while the backend runs as an Advanced I/O function.*

---

## 🔐 Environment Variables

Create a `.env` file in the `functions/vikshana_function/` directory. **Do not expose secrets in public repositories.**

```env
# Zoho Catalyst Configuration
CATALYST_PROJECT_ID=<your_project_id>
CATALYST_ENVIRONMENT=<environment>
CATALYST_ORG=<your_org_id>
CATALYST_TOKEN=<your_oauth_token>

# AI Endpoints
GLM_ENDPOINT=https://api.catalyst.zoho.in/quickml/v1/project/<project_id>/glm/chat
GLM_MODEL=crm-di-glm47b_30b_it
```

---

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/Vikshana.git
   cd Vikshana
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd react-app
   npm install
   cd ..
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd functions/vikshana_function
   npm install
   cd ../..
   ```

4. **Configure Environment Variables:**
   Copy the `.env.example` file and configure it with your credentials.
   ```bash
   cp functions/vikshana_function/.env.example functions/vikshana_function/.env
   ```

5. **Start the Catalyst Local Emulator:**
   ```bash
   catalyst serve
   ```

---

## 🎬 Demo Flow

To effectively demonstrate VIKSHANA, we recommend the following sequence:
1. **Login:** Authenticate using Catalyst Web SDK.
2. **Dashboard:** Show the high-level overview of the platform and current alerts.
3. **Select Case:** Open a complex case (e.g., a burglary or homicide) to populate the Context-Aware AI.
4. **AI Chat:** Ask the Copilot a complex question requiring case context.
5. **Evidence:** Demonstrate the intelligent mapping of digital and physical evidence.
6. **Relationship Explorer:** Demonstrate the Maltego-style visual graph of the extracted entities.
7. **Decision Support:** Let the AI recommend the next strategic move for the investigation.
8. **Generate Report:** Use the Report module to create a final, exportable docket.

---

## 📊 Current Implemented Modules

| Module | Purpose | Status |
| :--- | :--- | :--- |
| **Authentication** | Zoho Catalyst Web SDK integration | Complete |
| **Dashboard** | High-level system overview | Complete |
| **Investigation Workspace** | Central hub for active case data | Complete |
| **AI Copilot** | Context-aware chat interface | Complete |
| **Evidence Intelligence** | Analysis of case evidence | Complete |
| **FIR Intelligence** | Narrative understanding and entity extraction | Complete |
| **Relationship Explorer** | Visual node-based entity mapping | Complete |
| **Neural SQL** | Text-to-ZCQL database querying | Complete |
| **Decision Support** | AI-generated strategic next steps | Complete |
| **Report Generation** | Automated case docket creation | Complete |
| **Audit Logs** | System action tracking | Complete |

---

## 🔮 Future Scope

- **Vector Search:** Implementing embeddings for semantic search across historical case files.
- **Crime Similarity:** Machine Learning models to identify matching Modus Operandi (M.O.) across jurisdictions.
- **Heat Maps:** Geospatial visualization of crime density and active zones.
- **Workflow Management:** Task assignment and tracking for investigation teams.
- **RBAC (Role-Based Access Control):** Granular permissions for Officers, Detectives, and Admins.
- **Case Sharing:** Secure inter-departmental collaboration frameworks.
- **Chain of Custody:** Immutable audit trails for digital and physical evidence handling.

---

## 🤝 Contributors

| Name | Role | GitHub |
| :--- | :--- | :--- |
| **[Contributor Name]** | Full Stack / AI Engineer | [@username](https://github.com/) |
| **[Contributor Name]** | Backend Developer | [@username](https://github.com/) |
| **[Contributor Name]** | Frontend Developer | [@username](https://github.com/) |

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgements

- **Zoho Catalyst** for providing a robust, highly scalable serverless ecosystem.
- **Datathon** for hosting the hackathon and providing the challenge.
- **React** & **Node.js** communities for the excellent open-source foundations.
- **QuickML GLM** for powering our advanced natural language understanding.
