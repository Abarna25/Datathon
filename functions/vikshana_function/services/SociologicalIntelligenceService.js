const datastoreClient = require('../queries/datastoreClient');

class SociologicalIntelligenceService {
    static MIN_RECORDS_FOR_STATISTICAL_INSIGHT = 5; // Reduced from 10 to 5 for demonstration purposes

    static async getOverview(req) {
        try {
            const cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 1000 }).catch(() => []);
            const accused = await datastoreClient.getRows(req, 'Accused', { maxRows: 1000 }).catch(() => []);
            const victims = await datastoreClient.getRows(req, 'Victim', { maxRows: 1000 }).catch(() => []);

            if (cases.length < this.MIN_RECORDS_FOR_STATISTICAL_INSIGHT) {
                return {
                    status: "INSUFFICIENT_DATA",
                    message: "Not enough verified records to generate this insight.",
                    evidence: { records_analyzed: cases.length, records_required: this.MIN_RECORDS_FOR_STATISTICAL_INSIGHT },
                    data: null
                };
            }

            return {
                status: "AVAILABLE",
                data: {
                    totalCasesAnalyzed: cases.length,
                    totalAccusedAnalyzed: accused.length,
                    totalVictimsAnalyzed: victims.length,
                },
                evidence: {
                    records_analyzed: cases.length + accused.length + victims.length,
                    dataset: ['CaseMaster', 'Accused', 'Victim'],
                    time_range: 'All Available Data',
                    fields_used: ['ROWID']
                },
                method: "Deterministic Aggregation",
                limitations: ["This report evaluates ONLY the digital records present in the Catalyst Datastore. It does not account for physical evidence not yet uploaded or witness statements pending transcription."]
            };
        } catch (error) {
            console.error("Error in getOverview:", error);
            throw error;
        }
    }

    static async getDemographics(req) {
        try {
            const accused = await datastoreClient.getRows(req, 'Accused', { maxRows: 1000 }).catch(() => []);
            
            if (accused.length < this.MIN_RECORDS_FOR_STATISTICAL_INSIGHT) {
                return {
                    status: "INSUFFICIENT_DATA",
                    message: "Not enough verified accused records to generate demographic distribution.",
                    evidence: { records_analyzed: accused.length, records_required: this.MIN_RECORDS_FOR_STATISTICAL_INSIGHT },
                    data: null
                };
            }

            // Age Group Distribution
            const ageGroups = {
                '0-17': 0,
                '18-25': 0,
                '26-35': 0,
                '36-50': 0,
                '51-65': 0,
                '65+': 0,
                'Unknown': 0
            };

            // Gender Distribution (assuming 1=Male, 2=Female, etc. as per standard schema defaults)
            const genderMap = { 1: 'Male', 2: 'Female', 3: 'Other' };
            const genderDistribution = { 'Male': 0, 'Female': 0, 'Other': 0, 'Unknown': 0 };

            let validAgeCount = 0;
            let validGenderCount = 0;

            accused.forEach(record => {
                const age = record.AgeYear ? parseInt(record.AgeYear, 10) : null;
                if (age !== null && !isNaN(age)) {
                    validAgeCount++;
                    if (age <= 17) ageGroups['0-17']++;
                    else if (age <= 25) ageGroups['18-25']++;
                    else if (age <= 35) ageGroups['26-35']++;
                    else if (age <= 50) ageGroups['36-50']++;
                    else if (age <= 65) ageGroups['51-65']++;
                    else ageGroups['65+']++;
                } else {
                    ageGroups['Unknown']++;
                }

                const genderId = record.GenderID;
                if (genderId && genderMap[genderId]) {
                    validGenderCount++;
                    genderDistribution[genderMap[genderId]]++;
                } else {
                    genderDistribution['Unknown']++;
                }
            });

            // Calculate Percentages
            const ageDistributionData = Object.keys(ageGroups).map(group => ({
                group,
                count: ageGroups[group],
                percentage: accused.length > 0 ? parseFloat(((ageGroups[group] / accused.length) * 100).toFixed(2)) : 0
            })).filter(x => x.count > 0);

            const genderDistributionData = Object.keys(genderDistribution).map(category => ({
                category,
                count: genderDistribution[category],
                percentage: accused.length > 0 ? parseFloat(((genderDistribution[category] / accused.length) * 100).toFixed(2)) : 0
            })).filter(x => x.count > 0);

            return {
                status: "AVAILABLE",
                data: {
                    ageDistribution: ageDistributionData,
                    genderDistribution: genderDistributionData,
                    occupationDistribution: {
                        status: "INSUFFICIENT_DATA",
                        message: "The underlying 'Occupation' field is not available in the current Datastore schema for Accused records."
                    }
                },
                evidence: {
                    records_analyzed: accused.length,
                    dataset: ['Accused'],
                    fields_used: ['AgeYear', 'GenderID']
                },
                method: "Deterministic Aggregation",
                limitations: ["Data relies strictly on available inputs. 'Unknown' reflects records where age or gender was not documented.", "This describes the recorded dataset and does not establish causation."]
            };
        } catch (error) {
            console.error("Error in getDemographics:", error);
            throw error;
        }
    }
}

module.exports = SociologicalIntelligenceService;
