/**
 * translations.js
 * Comprehensive translation dictionary for English (en) and Kannada (kn).
 * Covers Navigation, Sidebar, Buttons, Forms, AI Assistant, Labels, Cards,
 * Tables, Empty States, Loading & Errors, Timeline, Dashboard, Evidence,
 * Reports, Settings, and Decision Support.
 *
 * For Hindi (hi) and Tamil (ta), static keys fall back to English.
 * Dynamic DB content (case titles, event descriptions) is translated
 * via the Zia API using useTranslateDynamic hook.
 */

const translations = {
  en: {
    // ── Navigation & Sidebar ──────────────────────────────────────────────
    nav: {
      appName: "VIKSHANA",
      dashboard: "Dashboard",
      investigationWorkspace: "Investigation Workspace",
      crimeIntelligence: "Crime Intelligence",
      decisionSupport: "Decision Support",
      relationshipExplorer: "Relationship Explorer",
      caseTimeline: "Case Timeline",
      evidenceLedger: "Evidence Ledger",
      reports: "Reports",
      settings: "Settings",
      searchPlaceholder: "Search everywhere (Cases, FIRs, Entities)...",
      activeCase: "Active Case",
      logout: "Logout",
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
      investigationWorkspace: "ತನಿಖಾ ಕ್ಷೇತ್ರ",
      crimeIntelligence: "ಅಪರಾಧ ಬುದ್ಧಿಮತ್ತೆ",
      decisionSupport: "ನಿರ್ಧಾರ ಬೆಂಬಲ",
      relationshipExplorer: "ಸಂಬಂಧಗಳ ಎಕ್ಸ್‌ಪ್ಲೋರರ್",
      caseTimeline: "ಪ್ರಕರಣದ ಕಾಲರೇಖೆ",
      evidenceLedger: "ಸಾಕ್ಷ್ಯಗಳ ವಹಿ",
      reports: "ವರದಿಗಳು",
      settings: "ಸಂಯೋಜನೆಗಳು",
      searchPlaceholder: "ಎಲ್ಲಾ ಕಡೆ ಹುಡುಕಿ (ಪ್ರಕರಣಗಳು, ಎಫ್‌ಐಆರ್)...",
      activeCase: "ಸಕ್ರಿಯ ಪ್ರಕರಣ",
      logout: "ನಿರ್ಗಮಿಸಿ",
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
    },

    // ── Framework 4 & 8 ────────────────────────────────────────────
    intelligence: {
      sociologicalTitle: "ಸಮಾಜಶಾಸ್ತ್ರೀಯ ಒಳನೋಟಗಳು",
      sociologicalDesc: "ದಾಖಲಾದ ಅಪರಾಧಗಳ ಜನಸಂಖ್ಯಾಶಾಸ್ತ್ರೀಯ ವಿಶ್ಲೇಷಣೆ.",
      forecastingTitle: "ಅಪರಾಧ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಮುನ್ನೆಚ್ಚರಿಕೆ",
      forecastingDesc: "ಐತಿಹಾಸಿಕ ಪ್ರವೃತ್ತಿ ಮತ್ತು ಮುನ್ಸೂಚನೆ ವಿಶ್ಲೇಷಣೆ.",
    }
  }
};

export default translations;
