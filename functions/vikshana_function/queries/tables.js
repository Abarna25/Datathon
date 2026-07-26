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
    ]
};

module.exports = tables;
