/**
 * ForensicController.js
 * REST Controller for Forensic Data Domains & Multi-Modal Intelligence.
 */

const ForensicService = require('../services/ForensicService');

class ForensicController {
    // 1. Evidence
    static async createEvidence(req, res) {
        try {
            const result = await ForensicService.createEvidence(req, req.body);
            res.status(201).json({ success: true, message: 'Evidence recorded with SHA-256 chain of custody.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getEvidenceByCase(req, res) {
        try {
            const { caseId } = req.params;
            const rows = await ForensicService.getEvidenceByCase(req, caseId);
            res.status(200).json({ success: true, count: rows.length, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message, data: [] });
        }
    }

    static async updateChainOfCustody(req, res) {
        try {
            const { evidenceId } = req.params;
            const result = await ForensicService.updateChainOfCustody(req, evidenceId, req.body);
            res.status(200).json({ success: true, message: 'Chain of custody updated.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    // 2. CCTV
    static async createCCTV(req, res) {
        try {
            const result = await ForensicService.createCCTVRecord(req, req.body);
            res.status(201).json({ success: true, message: 'CCTV metadata archived.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getCCTVByCase(req, res) {
        try {
            const { caseId } = req.params;
            const rows = await ForensicService.getCCTVByCase(req, caseId);
            res.status(200).json({ success: true, count: rows.length, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message, data: [] });
        }
    }

    // 3. CDR
    static async createCDR(req, res) {
        try {
            const result = await ForensicService.createCDR(req, req.body);
            res.status(201).json({ success: true, message: 'Call record logged.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getCDRByCase(req, res) {
        try {
            const { caseId } = req.params;
            const result = await ForensicService.getCDRByCase(req, caseId);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // 4. Financial
    static async createTransaction(req, res) {
        try {
            const result = await ForensicService.createTransaction(req, req.body);
            res.status(201).json({ success: true, message: 'Financial transaction analyzed and logged.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getTransactionsByCase(req, res) {
        try {
            const { caseId } = req.params;
            const result = await ForensicService.getTransactionsByCase(req, caseId);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async getFinancialOverview(req, res) {
        try {
            const FinancialIntelligenceService = require('../services/FinancialIntelligenceService');
            const result = await FinancialIntelligenceService.getFinancialOverview(req);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async getMoneyTrails(req, res) {
        try {
            const FinancialIntelligenceService = require('../services/FinancialIntelligenceService');
            const result = await FinancialIntelligenceService.analyzeMoneyTrails(req);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async getSuspiciousPatterns(req, res) {
        try {
            const FinancialIntelligenceService = require('../services/FinancialIntelligenceService');
            const result = await FinancialIntelligenceService.detectSuspiciousPatterns(req);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // 5. Forensic Reports
    static async createReport(req, res) {
        try {
            const result = await ForensicService.createForensicReport(req, req.body);
            res.status(201).json({ success: true, message: 'Forensic laboratory report registered.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getReportsByCase(req, res) {
        try {
            const { caseId } = req.params;
            const rows = await ForensicService.getReportsByCase(req, caseId);
            res.status(200).json({ success: true, count: rows.length, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message, data: [] });
        }
    }

    // 6. Weapons
    static async createWeapon(req, res) {
        try {
            const result = await ForensicService.createWeapon(req, req.body);
            res.status(201).json({ success: true, message: 'Weapon seized and registered.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getWeaponsByCase(req, res) {
        try {
            const { caseId } = req.params;
            const rows = await ForensicService.getWeaponsByCase(req, caseId);
            res.status(200).json({ success: true, count: rows.length, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message, data: [] });
        }
    }

    // 7. Vehicles
    static async createVehicle(req, res) {
        try {
            const result = await ForensicService.createVehicle(req, req.body);
            res.status(201).json({ success: true, message: 'Vehicle seizure logged.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getVehiclesByCase(req, res) {
        try {
            const { caseId } = req.params;
            const rows = await ForensicService.getVehiclesByCase(req, caseId);
            res.status(200).json({ success: true, count: rows.length, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message, data: [] });
        }
    }

    // 8. Biometrics
    static async createBiometric(req, res) {
        try {
            const result = await ForensicService.createBiometricRecord(req, req.body);
            res.status(201).json({ success: true, message: 'Biometric reference identifier saved.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getBiometricsByCase(req, res) {
        try {
            const { caseId } = req.params;
            const rows = await ForensicService.getBiometricsByCase(req, caseId);
            res.status(200).json({ success: true, count: rows.length, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message, data: [] });
        }
    }

    // 9. Court Hearings
    static async createCourtHearing(req, res) {
        try {
            const result = await ForensicService.createCourtHearing(req, req.body);
            res.status(201).json({ success: true, message: 'Court hearing proceedings recorded.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getCourtHearingsByCase(req, res) {
        try {
            const { caseId } = req.params;
            const rows = await ForensicService.getCourtHearingsByCase(req, caseId);
            res.status(200).json({ success: true, count: rows.length, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message, data: [] });
        }
    }

    // 10. Interrogation
    static async createInterrogation(req, res) {
        try {
            const result = await ForensicService.createInterrogationReport(req, req.body);
            res.status(201).json({ success: true, message: 'Interrogation report recorded.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getInterrogationsByCase(req, res) {
        try {
            const { caseId } = req.params;
            const rows = await ForensicService.getInterrogationsByCase(req, caseId);
            res.status(200).json({ success: true, count: rows.length, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message, data: [] });
        }
    }

    // 11. Vector RAG Search
    static async queryRAG(req, res) {
        try {
            const VectorRAGService = require('../services/VectorRAGService');
            const result = await VectorRAGService.answerGroundedQuery(req, req.body);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = ForensicController;
