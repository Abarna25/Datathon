class SeedService {
    static async seedUsers(req) {
        return { inserted: 0, existing: 0 };
    }

    static async seedAllCases(req) {
        return { userSeeding: { inserted: 0, existing: 0 }, caseSeeding: [] };
    }
}

module.exports = SeedService;
