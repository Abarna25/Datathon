const fs = require('fs');
const path = require('path');
const datastoreClient = require('../queries/datastoreClient');

class FinancialIntelligenceService {
    static DEMO_CSV_PATH = path.join(__dirname, '../../../dataset/financial_transactions_demo.csv');
    static DEMO_BANNER = "SIMULATED FINANCIAL DATA — FOR DEMONSTRATION PURPOSES ONLY";

    static async getTransactionsData(req) {
        let transactions = [];
        try {
            if (fs.existsSync(this.DEMO_CSV_PATH)) {
                const text = fs.readFileSync(this.DEMO_CSV_PATH, 'utf-8');
                const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
                if (lines.length > 1) {
                    const headers = lines[0].split(',').map(h => h.trim());
                    for (let i = 1; i < lines.length; i++) {
                        const parts = lines[i].split(',').map(p => p.trim());
                        if (parts.length < headers.length) continue;
                        const row = {};
                        headers.forEach((h, idx) => { row[h] = parts[idx]; });
                        transactions.push({
                            transactionId: row.transaction_id,
                            fromAccount: row.from_account,
                            toAccount: row.to_account,
                            amount: parseFloat(row.amount) || 0,
                            timestamp: row.timestamp,
                            transactionType: row.transaction_type,
                            location: row.location,
                            linkedCaseId: row.linked_case_id,
                            riskFlag: row.risk_flag,
                            dataSource: this.DEMO_BANNER
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Error reading financial demo CSV:', e);
        }

        if (transactions.length === 0) {
            transactions = [
                { transactionId: 'TXN_DEMO_1001', fromAccount: 'ACC_DEMO_001', toAccount: 'ACC_DEMO_002', amount: 450000, timestamp: '2026-01-10T10:15:00Z', transactionType: 'Wire Transfer', location: 'Bengaluru', linkedCaseId: 'CASE_KSP_2025_001', riskFlag: 'High Value', dataSource: this.DEMO_BANNER },
                { transactionId: 'TXN_DEMO_1002', fromAccount: 'ACC_DEMO_002', toAccount: 'ACC_DEMO_003', amount: 440000, timestamp: '2026-01-10T10:22:00Z', transactionType: 'IMPS', location: 'Bengaluru', linkedCaseId: 'CASE_KSP_2025_001', riskFlag: 'Rapid Transfer', dataSource: this.DEMO_BANNER },
                { transactionId: 'TXN_DEMO_1003', fromAccount: 'ACC_DEMO_003', toAccount: 'ACC_DEMO_004', amount: 435000, timestamp: '2026-01-10T10:30:00Z', transactionType: 'RTGS', location: 'Mysuru', linkedCaseId: 'CASE_KSP_2025_001', riskFlag: 'Rapid Transfer', dataSource: this.DEMO_BANNER },
                { transactionId: 'TXN_DEMO_1004', fromAccount: 'ACC_DEMO_004', toAccount: 'ACC_DEMO_001', amount: 430000, timestamp: '2026-01-10T10:45:00Z', transactionType: 'Wire Transfer', location: 'Bengaluru', linkedCaseId: 'CASE_KSP_2025_001', riskFlag: 'Circular Transaction', dataSource: this.DEMO_BANNER }
            ];
        }

        return transactions;
    }

    static async getFinancialOverview(req) {
        try {
            const transactions = await this.getTransactionsData(req);
            const accountSet = new Set();
            transactions.forEach(t => {
                accountSet.add(t.fromAccount);
                accountSet.add(t.toAccount);
            });

            const suspiciousPatterns = await this.detectSuspiciousPatterns(req);
            const moneyTrails = await this.analyzeMoneyTrails(req);

            return {
                status: 'SUCCESS',
                isDemoData: true,
                demoBanner: this.DEMO_BANNER,
                summaryCards: {
                    transactionsAnalyzed: transactions.length,
                    potentiallySuspiciousPatternsCount: suspiciousPatterns.patterns.length,
                    moneyTrailsDetectedCount: moneyTrails.trails.length,
                    connectedAccountsCount: accountSet.size
                },
                recentTransactions: transactions,
                dataProvenance: {
                    dataSource: 'Simulated Financial Transactions Demonstration Dataset',
                    datasetType: 'Synthetic Financial Demo Data',
                    coverage: `${accountSet.size} Synthetic Accounts`,
                    limitations: ['Synthetic accounts and transactions for demonstration analytics only.'],
                    lastUpdated: new Date().toISOString().split('T')[0]
                }
            };
        } catch (error) {
            console.error('Error in FinancialIntelligenceService getFinancialOverview:', error);
            throw error;
        }
    }

    static async analyzeMoneyTrails(req) {
        try {
            const transactions = await this.getTransactionsData(req);
            
            // Build adjacency graph of accounts
            const graph = new Map();
            transactions.forEach(t => {
                if (!graph.has(t.fromAccount)) graph.set(t.fromAccount, []);
                graph.get(t.fromAccount).push(t);
            });

            const trails = [];

            // Detect paths with 2 or more hops
            graph.forEach((txList, startAccount) => {
                txList.forEach(t1 => {
                    const nextHops = graph.get(t1.toAccount) || [];
                    nextHops.forEach(t2 => {
                        const pathAccounts = [t1.fromAccount, t1.toAccount, t2.toAccount];
                        const totalAmount = t1.amount + t2.amount;
                        
                        // Check if third hop exists
                        const thirdHops = graph.get(t2.toAccount) || [];
                        if (thirdHops.length > 0) {
                            thirdHops.forEach(t3 => {
                                pathAccounts.push(t3.toAccount);
                                trails.push({
                                    trailId: `TRAIL_${t1.transactionId}_${t3.transactionId}`,
                                    sourceAccount: startAccount,
                                    destinationAccount: t3.toAccount,
                                    path: pathAccounts,
                                    hopCount: 3,
                                    totalAmountFlow: totalAmount + t3.amount,
                                    linkedCases: Array.from(new Set([t1.linkedCaseId, t2.linkedCaseId, t3.linkedCaseId].filter(Boolean))),
                                    riskScore: 82,
                                    description: `Multi-hop transfer path: ${pathAccounts.join(' → ')}`
                                });
                            });
                        } else {
                            trails.push({
                                trailId: `TRAIL_${t1.transactionId}_${t2.transactionId}`,
                                sourceAccount: startAccount,
                                destinationAccount: t2.toAccount,
                                path: pathAccounts,
                                hopCount: 2,
                                totalAmountFlow: totalAmount,
                                linkedCases: Array.from(new Set([t1.linkedCaseId, t2.linkedCaseId].filter(Boolean))),
                                riskScore: 68,
                                description: `Two-hop transfer path: ${pathAccounts.join(' → ')}`
                            });
                        }
                    });
                });
            });

            return {
                status: 'SUCCESS',
                isDemoData: true,
                demoBanner: this.DEMO_BANNER,
                trails: trails.slice(0, 10),
                totalTrailsFound: trails.length
            };
        } catch (error) {
            console.error('Error in analyzeMoneyTrails:', error);
            throw error;
        }
    }

    static async detectSuspiciousPatterns(req) {
        try {
            const transactions = await this.getTransactionsData(req);
            const patterns = [];

            // 1. Rapid Multi-Hop Transfers
            const rapidTransfers = transactions.filter(t => t.riskFlag === 'Rapid Transfer');
            if (rapidTransfers.length > 0) {
                patterns.push({
                    patternId: 'PAT_RAPID_001',
                    patternType: 'Rapid Transfer Pattern',
                    severity: 'High',
                    accountsInvolved: Array.from(new Set(rapidTransfers.flatMap(t => [t.fromAccount, t.toAccount]))),
                    transactionCount: rapidTransfers.length,
                    evidenceSummary: `${rapidTransfers.length} transactions executed in rapid succession within short time windows.`,
                    riskScore: 78,
                    confidence: 'Medium-High',
                    status: 'Potentially Suspicious Pattern'
                });
            }

            // 2. Circular Transaction Detection (A -> B -> C -> A)
            const circularTransfers = transactions.filter(t => t.riskFlag === 'Circular Transaction');
            if (circularTransfers.length > 0) {
                patterns.push({
                    patternId: 'PAT_CIRCULAR_002',
                    patternType: 'Circular Transaction Pattern',
                    severity: 'Critical',
                    accountsInvolved: Array.from(new Set(circularTransfers.flatMap(t => [t.fromAccount, t.toAccount]))),
                    transactionCount: circularTransfers.length,
                    evidenceSummary: 'Funds circulated through intermediate accounts returning to original source account.',
                    riskScore: 88,
                    confidence: 'High',
                    status: 'Potentially Suspicious Pattern'
                });
            }

            // 3. High-Value Threshold Transfers
            const highValueTransfers = transactions.filter(t => t.amount >= 400000);
            if (highValueTransfers.length > 0) {
                patterns.push({
                    patternId: 'PAT_HIGHVAL_003',
                    patternType: 'High-Value Transaction Pattern',
                    severity: 'Moderate',
                    accountsInvolved: Array.from(new Set(highValueTransfers.flatMap(t => [t.fromAccount, t.toAccount]))),
                    transactionCount: highValueTransfers.length,
                    evidenceSummary: `${highValueTransfers.length} transactions exceeded configured high-value threshold (₹4,00,000).`,
                    riskScore: 62,
                    confidence: 'High',
                    status: 'Potentially Suspicious Pattern'
                });
            }

            return {
                status: 'SUCCESS',
                isDemoData: true,
                demoBanner: this.DEMO_BANNER,
                patterns,
                disclaimer: 'Patterns are categorized as "Potentially Suspicious". Statistical flag does not confirm unlawful activity without investigative verification.'
            };
        } catch (error) {
            console.error('Error in detectSuspiciousPatterns:', error);
            throw error;
        }
    }
}

module.exports = FinancialIntelligenceService;
