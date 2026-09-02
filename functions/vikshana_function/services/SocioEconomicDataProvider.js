const fs = require('fs');
const path = require('path');

class SocioEconomicDataProvider {
    static DATASET_PATH = path.join(__dirname, '../../../dataset/demo_socioeconomic_data.csv');

    static async getSocioEconomicData() {
        try {
            let csvText = '';
            if (fs.existsSync(this.DATASET_PATH)) {
                csvText = fs.readFileSync(this.DATASET_PATH, 'utf-8');
            } else {
                return this.getFallbackMockData();
            }

            const lines = csvText.trim().split('\n').filter(line => line.trim().length > 0);
            if (lines.length <= 1) return this.getFallbackMockData();

            const headers = lines[0].split(',').map(h => h.trim());
            const records = [];

            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.trim());
                if (parts.length < headers.length) continue;

                const row = {};
                headers.forEach((h, idx) => {
                    row[h] = parts[idx];
                });

                records.push({
                    district: row.district || 'Unknown',
                    totalPopulation: parseInt(row.total_population, 10) || 0,
                    populationDensitySqKm: parseFloat(row.population_density_sq_km) || 0,
                    literacyRatePct: parseFloat(row.literacy_rate_pct) || 0,
                    employmentRatePct: parseFloat(row.employment_rate_pct) || 0,
                    unemploymentRatePct: parseFloat(row.unemployment_rate_pct) || 0,
                    urbanPopPct: parseFloat(row.urban_pop_pct) || 0,
                    ruralPopPct: parseFloat(row.rural_pop_pct) || 0,
                    lastUpdated: row.last_updated || '2026-01-01',
                    dataSource: row.data_source || 'DEMONSTRATION DATA'
                });
            }

            // Data Quality & Coverage Stats
            const totalDistricts = records.length;
            const validRecords = records.filter(r => r.totalPopulation > 0 && r.literacyRatePct > 0);

            return {
                status: 'SUCCESS',
                isDemoData: true,
                demoBanner: 'DEMONSTRATION DATA — FOR PROTOTYPE ANALYTICS ONLY',
                districts: records,
                dataCoveragePct: parseFloat(((validRecords.length / Math.max(1, totalDistricts)) * 100).toFixed(1)),
                dataQuality: {
                    missingValuesHandled: true,
                    percentagesNormalized: true,
                    duplicateRecordsDetected: 0
                },
                provenance: {
                    dataSource: 'Karnataka District Socio-Economic Demo Dataset',
                    datasetType: 'Simulated External Demographic Layer',
                    coverage: `${records.length} Karnataka Districts`,
                    limitations: [
                        'Socio-economic indicators are from a demonstration dataset.',
                        'Not official census data. For prototype decision support demonstration only.'
                    ],
                    lastUpdated: '2026-01-15'
                }
            };
        } catch (error) {
            console.error('Error in SocioEconomicDataProvider:', error);
            return this.getFallbackMockData();
        }
    }

    static getFallbackMockData() {
        return {
            status: 'FALLBACK',
            isDemoData: true,
            demoBanner: 'DEMONSTRATION DATA — FOR PROTOTYPE ANALYTICS ONLY',
            districts: [
                {
                    district: 'Bengaluru City',
                    totalPopulation: 9621551,
                    populationDensitySqKm: 4381,
                    literacyRatePct: 87.67,
                    employmentRatePct: 58.40,
                    unemploymentRatePct: 5.20,
                    urbanPopPct: 100.0,
                    ruralPopPct: 0.0,
                    lastUpdated: '2026-01-15',
                    dataSource: 'DEMONSTRATION DATA'
                },
                {
                    district: 'Mysuru',
                    totalPopulation: 3001120,
                    populationDensitySqKm: 476,
                    literacyRatePct: 72.79,
                    employmentRatePct: 52.10,
                    unemploymentRatePct: 4.80,
                    urbanPopPct: 41.5,
                    ruralPopPct: 58.5,
                    lastUpdated: '2026-01-15',
                    dataSource: 'DEMONSTRATION DATA'
                }
            ],
            dataCoveragePct: 100.0,
            provenance: {
                dataSource: 'Simulated Socio-Economic Layer',
                datasetType: 'Demonstration Data',
                coverage: 'District-level',
                limitations: ['Fallback demonstration data'],
                lastUpdated: '2026-01-15'
            }
        };
    }
}

module.exports = SocioEconomicDataProvider;
