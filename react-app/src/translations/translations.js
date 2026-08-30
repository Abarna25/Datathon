/**
 * translations.js
 * Comprehensive translation dictionary for English (en), Kannada (kn), and Hindi (hi).
 * Covers Navigation, Sidebar, Roles, Buttons, Forms, Forensics Hub, AI Assistant, Labels, Cards,
 * Tables, Empty States, Loading & Errors, Timeline, Dashboard, Evidence,
 * Reports, Settings, and Decision Support.
 */

const translations = {
  en: {
    // ── Navigation & Sidebar ──────────────────────────────────────────────
    nav: {
      appName: "VIKSHANA",
      dashboard: "Dashboard",
      sentinel: "VIKSHANA Sentinel",
      investigationWorkspace: "Investigation Workspace",
      forensics: "Forensic Intelligence Hub",
      search: "Investigation Search",
      sociological: "Sociological Insights",
      forecasting: "Crime Forecasting",
      reports: "Investigation Report",
      auditLogs: "Audit Logs",
      crimeIntelligence: "Crime Intelligence",
      decisionSupport: "Decision Support",
      relationshipExplorer: "Relationship Explorer",
      caseTimeline: "Case Timeline",
      evidenceLedger: "Evidence Ledger",
      settings: "Settings",
      searchPlaceholder: "Search everywhere (Cases, FIRs, Entities)...",
      activeCase: "Active Case",
      logout: "Logout",
      primaryActions: "PRIMARY ACTIONS",
      intelligence: "INTELLIGENCE",
      adminReporting: "ADMIN & REPORTING",
      role: "ROLE",
      triage: "TRIAGE"
    },

    // ── Roles ─────────────────────────────────────────────────────────────
    roles: {
      Administrator: "Administrator",
      Investigator: "Investigator",
      Supervisor: "Supervisor",
      Analyst: "Analyst",
      Policymaker: "Policymaker",
      Officer: "Officer",
      Viewer: "Viewer"
    },

    // ── Forensics Hub ─────────────────────────────────────────────────────
    forensics: {
      title: "Multi-Modal Forensic & Intelligence Hub",
      subtitle: "Unified data layer covering 10 operational forensic domains, Vector-RAG retrieval, and Scikit-Learn Python ML.",
      activeCaseId: "Active Case ID:",
      refresh: "Refresh",
      tabs: {
        evidence: "Evidence & Chain of Custody",
        cctv: "CCTV Surveillance",
        cdr: "CDR Phone Intelligence",
        financial: "Financial Intelligence",
        reports: "Forensic Lab Reports",
        weapons: "Weapons & Ballistics",
        vehicles: "Vehicle Seizures",
        biometrics: "Biometrics & DNA",
        court: "Court Proceedings",
        interrogation: "Interrogations",
        rag: "Semantic Vector RAG",
        ml: "Python ML Pipeline"
      },
      evidenceSection: "Physical Evidence & Chain of Custody (Case #{caseId})",
      recordEvidence: "Record Evidence",
      descriptionPlaceholder: "Description of item...",
      vaultPlaceholder: "HQ Vault A-12",
      noEvidenceLogged: "No physical evidence logged for Case #{caseId} in Catalyst Datastore.",
      recordedItems: "recorded items",
      table: {
        evidenceId: "Evidence ID",
        type: "Type",
        description: "Description",
        storageLocation: "Storage Location",
        hash: "SHA-256 Hash",
        chainOfCustody: "Chain of Custody"
      },
      types: {
        physicalWeapon: "Physical Weapon",
        fingerprintLift: "Fingerprint Lift Card",
        bloodSwab: "Blood / Biological Swab",
        digitalMedia: "Digital Media / Flash Drive",
        narcotic: "Narcotic Substance",
        documentary: "Documentary Evidence"
      }
    },

    // ── Timeline ──────────────────────────────────────────────────────────
    timeline: {
      title: "Case Timeline",
      subtitle: "Chronological reconstruction of verified facts, evidence pings, and incident events for Case #",
      filterPlaceholder: "Filter timeline events...",
      loadingText: "Loading case timeline...",
      noResults: "No matching timeline events found for this query.",
      evidenceVerification: "Evidence Verification",
      unknownTimestamp: "Unknown Timestamp",
    },

    // ── Dashboard ─────────────────────────────────────────────────────────
    dashboard: {
      title: "Dashboard",
      subtitle: "Investigative Command Overview",
      activeCases: "Active Cases",
      pendingReview: "Pending Review",
      resolvedThisMonth: "Resolved This Month",
      criticalAlerts: "Critical Alerts",
      recentActivity: "Recent Activity",
      quickActions: "Quick Actions",
      openInvestigation: "Open Investigation",
      viewEvidence: "View Evidence",
      generateReport: "Generate Report",
    },

    // ── Evidence Ledger ───────────────────────────────────────────────────
    evidence: {
      title: "Evidence Ledger",
      subtitle: "All verified evidence linked to the active case",
      addEvidence: "Add Evidence",
      searchPlaceholder: "Search evidence...",
      filterAll: "All Types",
      filterCctv: "CCTV",
      filterDocument: "Document",
      filterForensic: "Forensic",
      filterWitness: "Witness",
      noEvidence: "No evidence records found.",
      loadingEvidence: "Loading evidence...",
      evidenceId: "Evidence ID",
      evidenceType: "Type",
      description: "Description",
      dateAdded: "Date Added",
      status: "Status",
      verified: "Verified",
      pending: "Pending",
      rejected: "Rejected",
    },

    // ── Reports ───────────────────────────────────────────────────────────
    reports: {
      title: "Reports",
      subtitle: "Generate and manage case investigation reports",
      generateReport: "Generate Report",
      downloadPdf: "Download PDF",
      reportType: "Report Type",
      caseReport: "Case Summary Report",
      evidenceReport: "Evidence Chain Report",
      suspectReport: "Suspect Profile Report",
      noReports: "No reports generated yet.",
      generating: "Generating report...",
      generated: "Report generated successfully",
    },

    // ── Settings ──────────────────────────────────────────────────────────
    settings: {
      title: "Settings",
      subtitle: "Application preferences and configuration",
      language: "Language",
      languageSubtitle: "Select the display language for the interface",
      theme: "Theme",
      notifications: "Notifications",
      account: "Account",
      saveChanges: "Save Changes",
      saved: "Changes saved",
    },

    // ── Decision Support ──────────────────────────────────────────────────
    decisionSupport: {
      title: "Decision Support",
      subtitle: "AI-powered investigative insights and risk assessment",
      riskScore: "Risk Score",
      recommendation: "Recommendation",
      confidenceScore: "Confidence Score",
      analysisInProgress: "Analysis in progress...",
    },

    // ── Sociological & AI Assistant Tabs & Section Titles ─────────────────
    intelligence: {
      crimeIntelligenceTab: "Crime Intelligence",
      sociologicalInsightsTab: "Sociological Insights",
      socialRiskTab: "Social Risk Index",
      analysisFilters: "Analysis Filters",
      allSectors: "All Sectors",
      sector1: "Sector 1",
      sector3: "Sector 3",
      lastMonth: "Last Month",
      last6Months: "Last 6 Months",
      lastYear: "Last Year",
      aiSociologicalAssistant: "AI Sociological Assistant",
      policyRecommendations: "Policy Recommendations",
      analysisEngineError: "Analysis Engine Error",
      retryAnalysis: "Retry Analysis",
      sociologicalTitle: "Sociological Insights & Demographic Intelligence",
      sociologicalDesc: "Demographic and socioeconomic correlations of registered crime incidents.",
      forecastingTitle: "Crime Forecasting & Early Warning",
      forecastingDesc: "Historical pattern analysis and predictive intelligence forecasting.",
    },

    // ── AI Assistant UI ───────────────────────────────────────────────────
    assistant: {
      title: "AI Sociological Assistant",
      subtitle: "Powered by GLM · Explainable AI enabled",
      clearConversation: "Clear",
      clearTooltip: "Clear conversation history",
      exportPdf: "Export PDF",
      exportingPdf: "Generating PDF...",
      exportSuccess: "PDF Exported Successfully!",
      exportError: "Failed to export PDF. Please try again.",
      askHeader: "Ask the Sociological Intelligence Assistant",
      askSubheader: "Analyse crime-linked socio-economic factors, district profiles, and get evidence-backed policy recommendations.",
      inputPlaceholder: "Ask about socio-economic factors, district risks, policy recommendations... (English / ಕನ್ನಡ)",
      sendButton: "Send",
      thinkingMessage: "Analysing socio-economic patterns...",
      confidenceHigh: "HIGH CONFIDENCE",
      confidenceMedium: "MEDIUM CONFIDENCE",
      confidenceLow: "LOW CONFIDENCE",
      supportingEvidence: "Supporting Indicators",
      explainabilityTitle: "Explainability",
      reasoningChain: "Reasoning Chain",
      supportingRecords: "Supporting Records",
      evidenceReferences: "Evidence References",
      dataSources: "Data Sources",
      relatedDistricts: "Related districts",
      policyRecommendationHeader: "POLICY RECOMMENDATION",
      suggestedFollowUps: "Suggested follow-ups",
      keyboardHint: "Enter to send · Shift+Enter for new line",
      yourQuestionLabel: "Your Question",
    },

    // ── Policy Recommendations ────────────────────────────────────────────
    policy: {
      title: "Policy Recommendations",
      criticalPriority: "Critical",
      highPriority: "High",
      mediumPriority: "Medium",
      lowPriority: "Low",
      allPriorities: "All Priorities",
      allStatuses: "All Statuses",
      allCategories: "All Categories",
      sortPriority: "Sort: Priority",
      sortImpact: "Sort: Impact",
      sortDate: "Sort: Last Updated",
      crimeReduction: "CRIME REDUCTION",
      detailsButton: "Details",
      collapseButton: "Collapse",
      takeAction: "Take Action",
      exportReport: "Export Report",
      totalRecs: "Total Recommendations",
    },

    // ── Common UI Labels & Buttons ────────────────────────────────────────
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      retry: "Retry",
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      confirm: "Confirm",
      noData: "No data available",
      languageName: "English",
      activeRole: "Investigator",
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  kn: {
    // ── Navigation & Sidebar ──────────────────────────────────────────────
    nav: {
      appName: "ವೀಕ್ಷಣ",
      dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      sentinel: "ವೀಕ್ಷಣಾ ಸೆಂಟಿನೆಲ್",
      investigationWorkspace: "ತನಿಖಾ ಕ್ಷೇತ್ರ",
      forensics: "ವಿಧಿವಿಜ್ಞಾನ ಗುಪ್ತಚರ ಕೇಂದ್ರ",
      search: "ತನಿಖಾ ಹುಡುಕಾಟ",
      sociological: "ಸಾಮಾಜಿಕ ಒಳನೋಟಗಳು",
      forecasting: "ಅಪರಾಧ ಮುನ್ಸೂಚನೆ",
      reports: "ತನಿಖಾ ವರದಿ",
      auditLogs: "ಆಡಿಟ್ ಲಾಗ್‌ಗಳು",
      crimeIntelligence: "ಅಪರಾಧ ಬುದ್ಧಿಮತ್ತೆ",
      decisionSupport: "ನಿರ್ಧಾರ ಬೆಂಬಲ",
      relationshipExplorer: "ಸಂಬಂಧಗಳ ಎಕ್ಸ್‌ಪ್ಲೋರರ್",
      caseTimeline: "ಪ್ರಕರಣದ ಕಾಲರೇಖೆ",
      evidenceLedger: "ಸಾಕ್ಷ್ಯಗಳ ವಹಿ",
      settings: "ಸಂಯೋಜನೆಗಳು",
      searchPlaceholder: "ಎಲ್ಲಾ ಕಡೆ ಹುಡುಕಿ (ಪ್ರಕರಣಗಳು, ಎಫ್‌ಐಆರ್, ವ್ಯಕ್ತಿಗಳು)...",
      activeCase: "ಸಕ್ರಿಯ ಪ್ರಕರಣ",
      logout: "ನಿರ್ಗಮಿಸಿ",
      primaryActions: "ಪ್ರಾಥಮಿಕ ಕ್ರಮಗಳು",
      intelligence: "ಗುಪ್ತಚರ",
      adminReporting: "ಆಡಳಿತ ಮತ್ತು ವರದಿ",
      role: "ಪಾತ್ರ",
      triage: "ವಿಂಗಡಣೆ"
    },

    // ── Roles ─────────────────────────────────────────────────────────────
    roles: {
      Administrator: "ನಿರ್ವಾಹಕ",
      Investigator: "ತನಿಖಾಧಿಕಾರಿ",
      Supervisor: "ಮೇಲ್ವಿಚಾರಕ",
      Analyst: "ವಿಶ್ಲೇಷಕ",
      Policymaker: "ನೀತಿ ನಿರೂಪಕ",
      Officer: "ಅಧಿಕಾರಿ",
      Viewer: "ವೀಕ್ಷಕ"
    },

    // ── Forensics Hub ─────────────────────────────────────────────────────
    forensics: {
      title: "ಬಹು-ಮಾದರಿ ವಿಧಿವಿಜ್ಞಾನ ಮತ್ತು ಗುಪ್ತಚರ ಕೇಂದ್ರ",
      subtitle: "10 ಕಾರ್ಯಾಚರಣಾ ವಿಧಿವಿಜ್ಞಾನ ಕ್ಷೇತ್ರಗಳು, ವೆಕ್ಟರ್-RAG ಮರುಪಡೆಯುವಿಕೆ ಮತ್ತು Scikit-Learn ಪೈಥಾನ್ ML ಅನ್ನು ಒಳಗೊಂಡಿರುವ ಏಕೀಕೃತ ಡೇಟಾ ಶ್ರೇಣಿ.",
      activeCaseId: "ಸಕ್ರಿಯ ಪ್ರಕರಣ ಐಡಿ:",
      refresh: "ನವೀಕರಿಸಿ",
      tabs: {
        evidence: "ಸಾಕ್ಷ್ಯ ಮತ್ತು ಪಾಲನೆಯ ಸರಪಳಿ",
        cctv: "ಸಿಸಿಟಿವಿ ಕಣ್ಗಾವಲು",
        cdr: "ಸಿಡಿಆರ್ ಫೋನ್ ಗುಪ್ತಚರ",
        financial: "ಹಣಕಾಸು ಗುಪ್ತಚರ",
        reports: "ವಿಧಿವಿಜ್ಞಾನ ಪ್ರಯೋಗಾಲಯ ವರದಿಗಳು",
        weapons: "ಆಯುಧಗಳು ಮತ್ತು ಬ್ಯಾಲಿಸ್ಟಿಕ್ಸ್",
        vehicles: "ವಾಹನ ಜಪ್ತಿಗಳು",
        biometrics: "ಬಯೋಮೆಟ್ರಿಕ್ಸ್ ಮತ್ತು ಡಿಎನ್‌ಎ",
        court: "ನ್ಯಾಯಾಲಯದ ಕಲಾಪಗಳು",
        interrogation: "ವಿಚಾರಣೆಗಳು",
        rag: "ಸೆಮ್ಯಾಂಟಿಕ್ ವೆಕ್ಟರ್ RAG",
        ml: "ಪೈಥಾನ್ ML ಪೈಪ್‌ಲೈನ್"
      },
      evidenceSection: "ಭೌತಿಕ ಸಾಕ್ಷ್ಯ ಮತ್ತು ಪಾಲನೆಯ ಸರಪಳಿ (ಪ್ರಕರಣ #{caseId})",
      recordEvidence: "ಸಾಕ್ಷ್ಯ ದಾಖಲಿಸಿ",
      descriptionPlaceholder: "ವಸ್ತುವಿನ ವಿವರಣೆ...",
      vaultPlaceholder: "ಪ್ರಧಾನ ಕಚೇರಿ ಕಪಾಟು A-12",
      noEvidenceLogged: "ಪ್ರಕರಣ #{caseId} ಗೆ ಯಾವುದೇ ಭೌತಿಕ ಸಾಕ್ಷ್ಯ ದಾಖಲಾಗಿಲ್ಲ.",
      recordedItems: "ದಾಖಲಾದ ವಸ್ತುಗಳು",
      table: {
        evidenceId: "ಸಾಕ್ಷ್ಯ ಐಡಿ",
        type: "ವಿಧ",
        description: "ವಿವರಣೆ",
        storageLocation: "ಸಂಗ್ರಹ ಸ್ಥಳ",
        hash: "SHA-256 ಹ್ಯಾಶ್",
        chainOfCustody: "ಪಾಲನೆಯ ಸರಪಳಿ"
      },
      types: {
        physicalWeapon: "ಭೌತಿಕ ಆಯುಧ",
        fingerprintLift: "ಬೆರಳಚ್ಚು ಕಾರ್ಡ್",
        bloodSwab: "ರಕ್ತ / ಜೈವಿಕ ಸ್ವ್ಯಾಬ್",
        digitalMedia: "ಡಿಜಿಟಲ್ ಮಾಧ್ಯಮ / ಫ್ಲ್ಯಾಶ್ ಡ್ರೈವ್",
        narcotic: "ಮಾದಕ ವಸ್ತು",
        documentary: "ದಾಖಲಾತಿ ಸಾಕ್ಷ್ಯ"
      }
    },

    // ── Timeline ──────────────────────────────────────────────────────────
    timeline: {
      title: "ಪ್ರಕರಣದ ಕಾಲರೇಖೆ",
      subtitle: "ಪ್ರಕರಣ #ಗಾಗಿ ದೃಢೀಕರಿಸಿದ ಸಂಗತಿಗಳು, ಸಾಕ್ಷ್ಯ ಪಿಂಗ್‌ಗಳು ಮತ್ತು ಘಟನೆಗಳ ಕಾಲಾನುಕ್ರಮ ಪುನರ್ನಿರ್ಮಾಣ",
      filterPlaceholder: "ಕಾಲರೇಖೆ ಘಟನೆಗಳನ್ನು ಶೋಧಿಸಿ...",
      loadingText: "ಪ್ರಕರಣದ ಕಾಲರೇಖೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
      noResults: "ಈ ಪ್ರಶ್ನೆಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ಕಾಲರೇಖೆ ಘಟನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
      evidenceVerification: "ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲನೆ",
      unknownTimestamp: "ಅಜ್ಞಾತ ಸಮಯ",
    },

    // ── Dashboard ─────────────────────────────────────────────────────────
    dashboard: {
      title: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      subtitle: "ತನಿಖಾ ಕಮಾಂಡ್ ಅವಲೋಕನ",
      activeCases: "ಸಕ್ರಿಯ ಪ್ರಕರಣಗಳು",
      pendingReview: "ಪರಿಶೀಲನೆ ಬಾಕಿ",
      resolvedThisMonth: "ಈ ತಿಂಗಳು ಪರಿಹರಿಸಲಾಗಿದೆ",
      criticalAlerts: "ತೀವ್ರ ಎಚ್ಚರಿಕೆಗಳು",
      recentActivity: "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ",
      quickActions: "ತ್ವರಿತ ಕ್ರಮಗಳು",
      openInvestigation: "ತನಿಖೆ ತೆರೆಯಿರಿ",
      viewEvidence: "ಸಾಕ್ಷ್ಯ ವೀಕ್ಷಿಸಿ",
      generateReport: "ವರದಿ ರಚಿಸಿ",
    },

    // ── Evidence Ledger ───────────────────────────────────────────────────
    evidence: {
      title: "ಸಾಕ್ಷ್ಯಗಳ ವಹಿ",
      subtitle: "ಸಕ್ರಿಯ ಪ್ರಕರಣಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ದೃಢೀಕರಿಸಿದ ಸಾಕ್ಷ್ಯಗಳು",
      addEvidence: "ಸಾಕ್ಷ್ಯ ಸೇರಿಸಿ",
      searchPlaceholder: "ಸಾಕ್ಷ್ಯ ಹುಡುಕಿ...",
      filterAll: "ಎಲ್ಲಾ ವಿಧಗಳು",
      filterCctv: "ಸಿಸಿಟಿವಿ",
      filterDocument: "ದಾಖಲೆ",
      filterForensic: "ನ್ಯಾಯವೈದ್ಯ",
      filterWitness: "ಸಾಕ್ಷಿ",
      noEvidence: "ಯಾವುದೇ ಸಾಕ್ಷ್ಯ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
      loadingEvidence: "ಸಾಕ್ಷ್ಯ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
      evidenceId: "ಸಾಕ್ಷ್ಯ ಐಡಿ",
      evidenceType: "ವಿಧ",
      description: "ವಿವರಣೆ",
      dateAdded: "ಸೇರಿಸಿದ ದಿನಾಂಕ",
      status: "ಸ್ಥಿತಿ",
      verified: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
      pending: "ಬಾಕಿ ಇದೆ",
      rejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    },

    // ── Reports ───────────────────────────────────────────────────────────
    reports: {
      title: "ವರದಿಗಳು",
      subtitle: "ಪ್ರಕರಣ ತನಿಖಾ ವರದಿಗಳನ್ನು ರಚಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ",
      generateReport: "ವರದಿ ರಚಿಸಿ",
      downloadPdf: "ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
      reportType: "ವರದಿ ವಿಧ",
      caseReport: "ಪ್ರಕರಣ ಸಾರಾಂಶ ವರದಿ",
      evidenceReport: "ಸಾಕ್ಷ್ಯ ಸರಪಳಿ ವರದಿ",
      suspectReport: "ಅನುಮಾನಿತ ಪ್ರೊಫೈಲ್ ವರದಿ",
      noReports: "ಇನ್ನೂ ಯಾವುದೇ ವರದಿಗಳು ರಚಿಸಲಾಗಿಲ್ಲ.",
      generating: "ವರದಿ ರಚಿಸಲಾಗುತ್ತಿದೆ...",
      generated: "ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ",
    },

    // ── Settings ──────────────────────────────────────────────────────────
    settings: {
      title: "ಸಂಯೋಜನೆಗಳು",
      subtitle: "ಅಪ್ಲಿಕೇಶನ್ ಆದ್ಯತೆಗಳು ಮತ್ತು ಸಂರಚನೆ",
      language: "ಭಾಷೆ",
      languageSubtitle: "ಇಂಟರ್‌ಫೇಸ್‌ಗಾಗಿ ಪ್ರದರ್ಶನ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ",
      theme: "ಥೀಮ್",
      notifications: "ಅಧಿಸೂಚನೆಗಳು",
      account: "ಖಾತೆ",
      saveChanges: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
      saved: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ",
    },

    // ── Decision Support ──────────────────────────────────────────────────
    decisionSupport: {
      title: "ನಿರ್ಧಾರ ಬೆಂಬಲ",
      subtitle: "ಎಐ-ಚಾಲಿತ ತನಿಖಾ ಒಳನೋಟಗಳು ಮತ್ತು ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ",
      riskScore: "ಅಪಾಯ ಸ್ಕೋರ್",
      recommendation: "ಶಿಫಾರಸು",
      confidenceScore: "ವಿಶ್ವಾಸ ಸ್ಕೋರ್",
      analysisInProgress: "ವಿಶ್ಲೇಷಣೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ...",
    },

    // ── Sociological & AI Assistant ───────────────────────────────────────
    intelligence: {
      crimeIntelligenceTab: "ಅಪರಾಧ ಇಂಟೆಲಿಜೆನ್ಸ್",
      sociologicalInsightsTab: "ಸಾಮಾಜಿಕ ಒಳನೋಟಗಳು",
      socialRiskTab: "ಸಾಮಾಜಿಕ ಅಪಾಯದ ಸೂಚ್ಯಂಕ",
      analysisFilters: "ವಿಶ್ಲೇಷಣೆ ಶೋಧಕಗಳು",
      allSectors: "ಎಲ್ಲಾ ವಲಯಗಳು",
      sector1: "ವಲಯ ೧",
      sector3: "ವಲಯ ೩",
      lastMonth: "ಕಳೆದ ತಿಂಗಳು",
      last6Months: "ಕಳೆದ ೬ ತಿಂಗಳುಗಳು",
      lastYear: "ಕಳೆದ ವರ್ಷ",
      aiSociologicalAssistant: "ಎಐ ಸಾಮಾಜಿಕ ಸಹಾಯಕ",
      policyRecommendations: "ನೀತಿ ಶಿಫಾರಸುಗಳು",
      analysisEngineError: "ವಿಶ್ಲೇಷಣೆ ಇಂಜಿನ್ ದೋಷ",
      retryAnalysis: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
      sociologicalTitle: "ಸಮಾಜಶಾಸ್ತ್ರೀಯ ಒಳನೋಟಗಳು ಮತ್ತು ಜನಸಂಖ್ಯಾ ಬುದ್ಧಿಮತ್ತೆ",
      sociologicalDesc: "ದಾಖಲಾದ ಅಪರಾಧ ಘಟನೆಗಳ ಜನಸಂಖ್ಯಾಶಾಸ್ತ್ರೀಯ ಮತ್ತು ಸಾಮಾಜಿಕ-ಆರ್ಥಿಕ ಪರಸ್ಪರ ಸಂಬಂಧಗಳು.",
      forecastingTitle: "ಅಪರಾಧ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಮುನ್ನೆಚ್ಚರಿಕೆ",
      forecastingDesc: "ಐತಿಹಾಸಿಕ ಪ್ರವೃತ್ತಿ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಭವಿಷ್ಯಸೂಚಕ ಗುಪ್ತಚರ ಮುನ್ಸೂಚನೆ.",
    },

    // ── AI Assistant UI ───────────────────────────────────────────────────
    assistant: {
      title: "ಎಐ ಸಾಮಾಜಿಕ ಸಹಾಯಕ",
      subtitle: "ಜಿಎಲ್‌ಎಮ್ ಆಧಾರಿತ · ವಿವರಣಾತ್ಮಕ ಎಐ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ",
      clearConversation: "ಅಳಿಸಿ",
      clearTooltip: "ಸಂಭಾಷಣೆಯ ಇತಿಹಾಸವನ್ನು ಅಳಿಸಿ",
      exportPdf: "ಪಿಡಿಎಫ್ ರಫ್ತು ಮಾಡಿ",
      exportingPdf: "ಪಿಡಿಎಫ್ ರಚಿಸಲಾಗುತ್ತಿದೆ...",
      exportSuccess: "ಪಿಡಿಎಫ್ ಯಶಸ್ವಿಯಾಗಿ ರಫ್ತಾಗಿದೆ!",
      exportError: "ಪಿಡಿಎಫ್ ರಫ್ತು ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      askHeader: "ಸಾಮಾಜಿಕ ಇಂಟೆಲಿಜೆನ್ಸ್ ಸಹಾಯಕನನ್ನು ಕೇಳಿ",
      askSubheader: "ಅಪರಾಧ-ಸಂಬಂಧಿತ ಸಾಮಾಜಿಕ-ಆರ್ಥಿಕ ಅಂಶಗಳು, ಜಿಲ್ಲಾ ಪ್ರೊಫೈಲ್‌ಗಳು ಮತ್ತು ಸಾಕ್ಷ್ಯ ಆಧಾರಿತ ನೀತಿ ಶಿಫಾರಸುಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ.",
      inputPlaceholder: "ಸಾಮಾಜಿಕ-ಆರ್ಥಿಕ ಅಂಶಗಳು, ಜಿಲ್ಲಾ ಅಪಾಯಗಳು, ನೀತಿ ಶಿಫಾರಸುಗಳ ಬಗ್ಗೆ ಕೇಳಿ... (English / ಕನ್ನಡ)",
      sendButton: "ಕಳುಹಿಸಿ",
      thinkingMessage: "ಸಾಮಾಜಿಕ-ಆರ್ಥಿಕ ಮಾದರಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
      confidenceHigh: "ಹೆಚ್ಚಿನ ಆತ್ಮವಿಶ್ವಾಸ",
      confidenceMedium: "ಮಧ್ಯಮ ಆತ್ಮವಿಶ್ವಾಸ",
      confidenceLow: "ಕಡಿಮೆ ಆತ್ಮವಿಶ್ವಾಸ",
      supportingEvidence: "ಬೆಂಬಲಿಸುವ ಸೂಚಕಗಳು",
      explainabilityTitle: "ವಿವರಣಾತ್ಮಕತೆ",
      reasoningChain: "ತಾರ್ಕಿಕ ಸರಪಳಿ",
      supportingRecords: "ಬೆಂಬಲಿಸುವ ದಾಖಲೆಗಳು",
      evidenceReferences: "ಸಾಕ್ಷ್ಯ ಉಲ್ಲೇಖಗಳು",
      dataSources: "ಮಾಹಿತಿ ಮೂಲಗಳು",
      relatedDistricts: "ಸಂಬಂಧಿತ ಜಿಲ್ಲೆಗಳು",
      policyRecommendationHeader: "ನೀತಿ ಶಿಫಾರಸು",
      suggestedFollowUps: "ಸೂಚಿಸಿದ ಮುಂದುವರಿದ ಪ್ರಶ್ನೆಗಳು",
      keyboardHint: "ಕಳುಹಿಸಲು Enter ಒತ್ತಿ · ಹೊಸ ಸಾಲಿಗೆ Shift+Enter ಒತ್ತಿ",
      yourQuestionLabel: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ",
    },

    // ── Policy Recommendations ────────────────────────────────────────────
    policy: {
      title: "ನೀತಿ ಶಿಫಾರಸುಗಳು",
      criticalPriority: "ಅತ್ಯಂತ ತುರ್ತು",
      highPriority: "ಹೆಚ್ಚಿನ ಆದ್ಯತೆ",
      mediumPriority: "ಮಧ್ಯಮ ಆದ್ಯತೆ",
      lowPriority: "ಸಾಮಾನ್ಯ ಆದ್ಯತೆ",
      allPriorities: "ಎಲ್ಲಾ ಆದ್ಯತೆಗಳು",
      allStatuses: "ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು",
      allCategories: "ಎಲ್ಲಾ ವರ್ಗಗಳು",
      sortPriority: "ವಿಂಗಡಣೆ: ಆದ್ಯತೆ",
      sortImpact: "ವಿಂಗಡಣೆ: ಪ್ರಭಾವ",
      sortDate: "ವಿಂಗಡಣೆ: ನವೀಕರಿಸಿದ ದಿನಾಂಕ",
      crimeReduction: "ಅಪರಾಧ ಕಡಿತ",
      detailsButton: "ವಿವರಗಳು",
      collapseButton: "ಮಡಚಿ",
      takeAction: "ಕ್ರಮ ಕೈಗೊಳ್ಳಿ",
      exportReport: "ವರದಿ ರಫ್ತು ಮಾಡಿ",
      totalRecs: "ಒಟ್ಟು ಶಿಫಾರಸುಗಳು",
    },

    // ── Common UI Labels & Buttons ────────────────────────────────────────
    common: {
      loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
      error: "ದೋಷ",
      success: "ಯಶಸ್ಸು",
      retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
      close: "ಮುಚ್ಚಿ",
      cancel: "ರದ್ದುಮಾಡಿ",
      save: "ಉಳಿಸಿ",
      confirm: "ಖಚಿತಪಡಿಸಿ",
      noData: "ಯಾವುದೇ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ",
      languageName: "ಕನ್ನಡ",
      activeRole: "ತನಿಖಾಧಿಕಾರಿ",
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  hi: {
    nav: {
      appName: "वीक्षणा",
      dashboard: "डैशबोर्ड",
      sentinel: "वीक्षणा सेंटिनल",
      investigationWorkspace: "जांच कार्यक्षेत्र",
      forensics: "फोरेंसिक इंटेलिजेंस हब",
      search: "जांच खोज",
      sociological: "सामाजिक अंतर्दृष्टि",
      forecasting: "अपराध पूर्वानुमान",
      reports: "जांच रिपोर्ट",
      auditLogs: "ऑडिट लॉग",
      crimeIntelligence: "अपराध इंटेलिजेंस",
      decisionSupport: "निर्णय समर्थन",
      relationshipExplorer: "संबंध अन्वेषक",
      caseTimeline: "मामला समयरेखा",
      evidenceLedger: "साक्ष्य बहीखाता",
      settings: "सेटिंग्स",
      searchPlaceholder: "हर जगह खोजें (मामले, प्राथमिकी, संस्थाएं)...",
      activeCase: "सक्रिय मामला",
      logout: "लॉग आउट",
      primaryActions: "प्राथमिक क्रियाएं",
      intelligence: "इंटेलिजेंस",
      adminReporting: "प्रशासन और रिपोर्टिंग",
      role: "भूमिका",
      triage: "ट्राएज"
    },
    roles: {
      Administrator: "प्रशासक",
      Investigator: "जांचकर्ता",
      Supervisor: "पर्यवेक्षक",
      Analyst: "विश्लेषक",
      Policymaker: "नीति निर्माता",
      Officer: "अधिकारी",
      Viewer: "दर्शक"
    },
    forensics: {
      title: "मल्टी-मॉडल फोरेंसिक और इंटेलिजेंस हब",
      subtitle: "10 फोरेंसिक डोमेन, वेक्टर-RAG और Scikit-Learn पायथन ML को एकीकृत करने वाली डेटा परत।",
      activeCaseId: "सक्रिय मामला आईडी:",
      refresh: "ताज़ा करें",
      tabs: {
        evidence: "साक्ष्य और अभिरक्षा श्रृंखला",
        cctv: "सीसीटीवी निगरानी",
        cdr: "सीडीआर फोन इंटेलिजेंस",
        financial: "वित्तीय इंटेलिजेंस",
        reports: "फोरेंसिक लैब रिपोर्ट",
        weapons: "हथियार और बैलिस्टिक",
        vehicles: "वाहन जब्ती",
        biometrics: "बायोमेट्रिक्स और डीएनए",
        court: "न्यायालय की कार्यवाही",
        interrogation: "पूछताछ",
        rag: "सिमेंटिक वेक्टर RAG",
        ml: "पायथन ML पाइपलाइन"
      },
      evidenceSection: "भौतिक साक्ष्य और अभिरक्षा श्रृंखला (मामला #{caseId})",
      recordEvidence: "साक्ष्य दर्ज करें",
      descriptionPlaceholder: "वस्तु का विवरण...",
      vaultPlaceholder: "मुख्यालय वॉल्ट A-12",
      noEvidenceLogged: "मामला #{caseId} के लिए कोई भौतिक साक्ष्य लॉग नहीं है।",
      recordedItems: "दर्ज की गई वस्तुएं",
      table: {
        evidenceId: "साक्ष्य आईडी",
        type: "प्रकार",
        description: "विवरण",
        storageLocation: "भंडारण स्थान",
        hash: "SHA-256 हैश",
        chainOfCustody: "अभिरक्षा श्रृंखला"
      }
    },
    common: {
      loading: "लोड हो रहा है...",
      error: "त्रुटि",
      success: "सफलता",
      retry: "पुनः प्रयास करें",
      close: "बंद करें",
      cancel: "रद्द करें",
      save: "सहेजें",
      confirm: "पुष्टि करें",
      noData: "कोई डेटा उपलब्ध नहीं है",
      languageName: "हिन्दी",
      activeRole: "जांचकर्ता",
    }
  }
};

export default translations;
