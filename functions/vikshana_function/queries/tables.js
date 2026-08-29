/**
 * Centralized schema registry containing the 24 official operational tables
 * from the Karnataka State Police ER Diagram.
 */
const tables = {
    CaseMaster: [
        'CaseMasterID', 'CrimeNo', 'CaseNo', 'CrimeRegisteredDate', 'PolicePersonID',
        'PoliceStationID', 'CaseCategoryID', 'GravityOffenceID', 'CrimeMajorHeadID',
        'CrimeMinorHeadID', 'CaseStatusID', 'CourtID', 'IncidentFromDate', 'IncidentToDate',
        'InfoReceivedPSDate', 'latitude', 'longitude', 'BriefFacts'
    ],
    ComplainantDetails: [
        'ComplainantID', 'CaseMasterID', 'ComplainantName', 'AgeYear', 'OccupationID',
        'ReligionID', 'CasteID', 'GenderID'
    ],
    Victim: [
        'VictimMasterID', 'CaseMasterID', 'VictimName', 'AgeYear', 'GenderID', 'VictimPolice'
    ],
    Accused: [
        'AccusedMasterID', 'CaseMasterID', 'AccusedName', 'AgeYear', 'GenderID', 'PersonID'
    ],
    ArrestSurrender: [
        'ArrestSurrenderID', 'CaseMasterID', 'AccusedMasterID', 'ArrestSurrenderDate',
        'PoliceStationID', 'CourtID', 'IsAccused', 'ArrestSurrenderTypeID'
    ],
    ActSectionAssociation: [
        'CaseMasterID', 'ActID', 'SectionID', 'ActOrderID', 'SectionOrderID'
    ],
    ChargesheetDetails: [
        'CSID', 'CaseMasterID', 'csdate', 'cstype', 'PolicePersonID'
    ],
    CrimeHead: [
        'CrimeHeadID', 'CrimeGroupName', 'Active'
    ],
    CrimeSubHead: [
        'CrimeSubHeadID', 'CrimeHeadID', 'CrimeHeadName', 'SeqID'
    ],
    Act: [
        'ActCode', 'ActDescription', 'ShortName', 'Active'
    ],
    Section: [
        'ActCode', 'SectionCode', 'SectionDescription', 'Active'
    ],
    Employee: [
        'EmployeeID', 'DistrictID', 'UnitID', 'RankID', 'DesignationID', 'KGID',
        'FirstName', 'EmployeeDOB', 'GenderID', 'BloodGroupID', 'PhysicallyChallenged',
        'AppointmentDate'
    ],
    Unit: [
        'UnitID', 'UnitName', 'TypeID', 'ParentUnit', 'StateID', 'DistrictID', 'Active'
    ],
    Court: [
        'CourtID', 'CourtName', 'DistrictID', 'StateID', 'Active'
    ],
    District: [
        'DistrictID', 'DistrictName', 'StateID', 'Active'
    ],
    State: [
        'StateID', 'StateName', 'NationalityID', 'Active'
    ],
    CaseCategory: [
        'CaseCategoryID', 'LookupValue'
    ],
    GravityOffence: [
        'GravityOffenceID', 'LookupValue'
    ],
    ReligionMaster: [
        'ReligionID', 'ReligionName'
    ],
    OccupationMaster: [
        'OccupationID', 'OccupationName'
    ],
    CasteMaster: [
        'caste_master_id', 'caste_master_name'
    ],
    Designation: [
        'DesignationID', 'DesignationName', 'Active', 'SortOrder'
    ],
    Rank: [
        'RankID', 'RankName', 'Hierarchy', 'Active'
    ],
    UnitType: [
        'UnitTypeID', 'UnitTypeName', 'CityDistState', 'Hierarchy', 'Active'
    ],
    Investigation_Conversation: [
        'id', 'caseId', 'officerId', 'title', 'isBookmarked', 'isArchived', 'lastMessageAt', 'createdAt'
    ],
    Investigation_Message: [
        'id', 'conversationId', 'role', 'content', 'citations', 'createdAt'
    ],
    AuditLog: [
        'log_id', 'timestamp', 'user_name', 'role', 'action', 'resource', 'case_id', 'status', 'ip_address', 'browser', 'aiReasoning', 'confidence', 'evidenceSources'
    ],
    Inv_OccuranceTime: [
        'CaseMasterID', 'IncidentFromDate', 'IncidentToDate', 'InfoReceivedPSDate'
    ],
    // New Forensic Entities & User Persistence
    Evidence: [
        'EvidenceID', 'CaseMasterID', 'EvidenceType', 'Description', 'CollectedBy', 'CollectedDate',
        'StorageLocation', 'FileHash', 'FileName', 'FileSize', 'ChainOfCustodyStatus', 'CreatedTime', 'UpdatedTime'
    ],
    CCTVRecord: [
        'CCTVRecordID', 'CaseMasterID', 'CameraID', 'Location', 'RecordingFromDate', 'RecordingToDate',
        'StorageReference', 'FileHash', 'Description', 'Status', 'Source', 'CreatedTime'
    ],
    CallDetailRecord: [
        'CDRID', 'CaseMasterID', 'CallerPhone', 'ReceiverPhone', 'CallTimestamp', 'DurationSeconds',
        'CallType', 'CellTowerLocation', 'IMEI', 'Source', 'CreatedTime'
    ],
    FinancialTransaction: [
        'TransactionID', 'CaseMasterID', 'SourceAccount', 'DestinationAccount', 'BankName',
        'TransactionDate', 'Amount', 'TransactionType', 'IsSuspicious', 'SuspiciousReason', 'Source', 'CreatedTime'
    ],
    ForensicReport: [
        'ReportID', 'CaseMasterID', 'ForensicType', 'LaboratoryName', 'ExpertName', 'SubmittedDate',
        'CompletedDate', 'FindingsSummary', 'ResultStatus', 'ReportFileHash', 'CreatedTime'
    ],
    Weapon: [
        'WeaponID', 'CaseMasterID', 'WeaponType', 'MakeModel', 'CaliberSerialNo', 'RecoveredFrom',
        'RecoveryLocation', 'RecoveryDate', 'BallisticsMatchStatus', 'CreatedTime'
    ],
    Vehicle: [
        'VehicleID', 'CaseMasterID', 'RegistrationNo', 'VehicleType', 'Make', 'Model', 'Color',
        'OwnerName', 'ChassisNo', 'EngineNo', 'SeizureStatus', 'CreatedTime'
    ],
    BiometricRecord: [
        'BiometricID', 'CaseMasterID', 'AccusedMasterID', 'BiometricType', 'ReferenceID',
        'MatchConfidence', 'MatchSource', 'VerifiedByExpert', 'CreatedTime'
    ],
    CourtHearing: [
        'HearingID', 'CaseMasterID', 'CourtID', 'HearingDate', 'JudgeName', 'HearingStage',
        'ProceedingsSummary', 'NextHearingDate', 'CourtOrder', 'CreatedTime'
    ],
    InterrogationReport: [
        'InterrogationID', 'CaseMasterID', 'AccusedMasterID', 'InterrogatingOfficerID',
        'InterrogationDate', 'KeyAdmissions', 'Summary', 'VerifiedStatus', 'CreatedTime'
    ],
    UserMaster: [
        'UserID', 'Username', 'Email', 'PasswordHash', 'Salt', 'Iterations',
        'Role', 'Department', 'Name', 'Status', 'CreatedAt', 'UpdatedAt',
        'id', 'username', 'email', 'passwordHash', 'salt', 'iterations',
        'role', 'department', 'name', 'accountStatus', 'AccountStatus',
        'createdAt', 'updatedAt', 'passwordChangedAt', 'PasswordChangedAt'
    ]
};

module.exports = tables;
