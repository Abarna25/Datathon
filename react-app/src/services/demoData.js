export const DEMO_DATA = {
    dashboard: {
        totalCases: 124,
        activeCases: 42,
        highRiskEntities: 15,
        evidenceCount: 890,
        timelineProgress: 75,
        confidenceScore: 92,
        courtReadiness: 88,
        officerWorkload: 85,
        crimeTrend: [ { name: 'Jan', crimes: 40 }, { name: 'Feb', crimes: 30 }, { name: 'Mar', crimes: 45 }, { name: 'Apr', crimes: 50 }, { name: 'May', crimes: 35 }, { name: 'Jun', crimes: 20 } ],
        hotspots: [ { district: 'Central', count: 120 }, { district: 'North', count: 80 }, { district: 'South', count: 40 } ],
        alerts: [ { message: 'High Risk Suspect Movement Detected', severity: 'High' } ],
        weeklyPrediction: [{ day: 'Mon', count: 5 }, { day: 'Tue', count: 8 }, { day: 'Wed', count: 12 }, { day: 'Thu', count: 7 }, { day: 'Fri', count: 15 }],
        monthlyPrediction: [{ month: 'May', count: 45 }, { month: 'Jun', count: 60 }],
        districtForecast: [{ district: 'Koramangala', count: 25 }, { district: 'Indiranagar', count: 15 }],
        crimeTypeForecast: [{ type: 'Financial Fraud', count: 30 }, { type: 'Cybercrime', count: 25 }]
    },
    timeline: [
        { id: 1, date: '2026-07-20 08:30', title: 'FIR Registered', description: 'Case #10020 opened for homicide investigation.', type: 'milestone', icon: 'FileText' },
        { id: 2, date: '2026-07-20 09:15', title: 'Crime Scene Secured', description: 'First responders secured the perimeter at MG Road.', type: 'action', icon: 'ShieldAlert' },
        { id: 3, date: '2026-07-21 14:00', title: 'CCTV Collected', description: 'Recovered footage from Alpha Hotel showing suspect vehicle.', type: 'evidence', icon: 'Video' },
        { id: 4, date: '2026-07-22 10:30', title: 'Witness Examined', description: 'Statement recorded from shopkeeper.', type: 'action', icon: 'Users' },
        { id: 5, date: '2026-07-23 11:45', title: 'DNA Submitted', description: 'Swabs sent to central forensic lab.', type: 'evidence', icon: 'Activity' },
        { id: 6, date: '2026-07-24 09:00', title: 'Phone Analysis', description: 'Tower dump confirms burner phone pinged near crime scene.', type: 'milestone', icon: 'Smartphone' },
        { id: 7, date: '2026-07-25 15:30', title: 'Suspect Identified', description: 'John Doe officially named as primary suspect based on DNA and CCTV.', type: 'alert', icon: 'Target' }
    ],
    evidence: [
        { id: 'E1', title: 'Glock 19 Handgun', type: 'Weapon', confidence: 98, source: 'Crime Scene', custody: 'Forensics Lab', suspects: ['John Doe'] },
        { id: 'E2', title: 'CCTV Footage (AT-102)', type: 'Video', confidence: 95, source: 'Alpha Hotel', custody: 'Digital Evidence Unit', suspects: ['John Doe', 'Unknown Accomplice'] },
        { id: 'E3', title: 'Burner Phone Log', type: 'Digital', confidence: 99, source: 'Telecom Provider', custody: 'Cyber Cell', suspects: ['John Doe'] },
        { id: 'E4', title: 'DNA Swab', type: 'Biological', confidence: 99, source: 'Victim Clothing', custody: 'Forensics Lab', suspects: ['John Doe'] }
    ],
    decisionSupport: {
        riskMeter: 92,
        confidenceGauge: 88,
        courtReadiness: 85,
        missingEvidence: ['Financial Motive Proof', 'Second Suspect Identification'],
        aiRecommendations: ['Request international travel alert for John Doe', 'Analyze Bank Transfer #8812 for accomplice links'],
        nextSteps: ['Dispatch warrant squad', 'Secure bank freeze order']
    },
    reports: [
        { id: 'R1', title: 'Executive Summary - Case 10020', date: '2026-07-25', status: 'Generated', type: 'Executive' },
        { id: 'R2', title: 'Court Brief - John Doe', date: '2026-07-25', status: 'Ready for Review', type: 'Legal' },
        { id: 'R3', title: 'Forensic DNA Report', date: '2026-07-24', status: 'Finalized', type: 'Evidence' }
    ]
};
