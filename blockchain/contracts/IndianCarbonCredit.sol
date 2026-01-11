// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IndianCarbonCredit_Full_Fixed
 * @dev Fixed scaling issues for 18-decimal precision.
 */
contract IndianCarbonCredit {

    // ==================== ERC-20 STANDARD ====================
    string public name = "Indian Carbon Credit";
    string public symbol = "ICC";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    uint256 constant SCALE = 1e18; // Added for precision scaling

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => mapping(uint256 => uint256)) public vintageBalances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event VintageTransfer(address indexed from, address indexed to, uint256 value, uint256 vintageYear);
    event CreditsBurned(address indexed account, uint256 amount, uint256 vintageYear);

    // ==================== ROLES ====================
    address public BEE_ADMIN;
    mapping(address => bool) public accreditedAuditors;

    modifier onlyBEE() {
        require(msg.sender == BEE_ADMIN, "Only BEE Admin");
        _;
    }

    modifier onlyAuditor() {
        require(accreditedAuditors[msg.sender], "Only Accredited Auditor");
        _;
    }

    // ==================== DATA STRUCTURES ====================
    enum Sector { Cement, Iron_Steel, Fertilizer, Petrochemical, Chlor_Alkali, Aluminium, Copper, Pulp_Paper, Textiles }

    struct AuditEntry {
        address auditor;
        address target;
        string auditType;
        uint256 value; 
        uint256 timestamp;
    }

    AuditEntry[] public auditHistory;

    struct GreenProject {
        address owner;
        string gpsCoordinates;
        string speciesType;
        uint256 totalArea;
        uint256 cumulativeCreditsIssued;
        uint256 lastAuditDate;
        bool isRegistered;
    }

    struct Organization {
        string name;
        Sector sector;
        uint256 targetGEI; // Target * 1000
        uint256 actualGEI; // Actual * 1000
        uint256 annualProduction;
        bool isCompliant;
        bool isRegistered;
        uint256 lastSettlementYear;
    }

    struct PurchaseRequest {
        address buyer;
        uint256 amountInTonnes;
        bool isFullfilled;
    }

    mapping(address => GreenProject) public greenProjects;
    mapping(string => bool) public gpsUsed;
    mapping(address => Organization) public organizations;
    mapping(Sector => uint256) public sectorTargets;

    PurchaseRequest[] public marketRequests;
    address[] public projectOwners;
    address[] public orgAddresses;

    // ==================== EVENTS ====================
    event ProjectRegistered(address indexed owner, string gpsCoordinates);
    event OrganizationRegistered(address indexed org, Sector sector);
    event ComplianceUpdated(address indexed org, uint256 actualGEI, bool isCompliant, uint256 rewardMinted);
    event BuyRequestCreated(uint256 requestId, address buyer, uint256 amount);
    event RequestFulfilled(uint256 requestId, address seller, address buyer, uint256 amount);
    event ComplianceSettled(address indexed org, uint256 creditsBurned, uint256 year);

    constructor() {
        BEE_ADMIN = msg.sender;
        sectorTargets[Sector.Cement] = 650; 
        sectorTargets[Sector.Iron_Steel] = 2100;
        sectorTargets[Sector.Fertilizer] = 3200;
        sectorTargets[Sector.Petrochemical] = 800;
        sectorTargets[Sector.Chlor_Alkali] = 1500;
        sectorTargets[Sector.Aluminium] = 9000;
        sectorTargets[Sector.Copper] = 3500;
        sectorTargets[Sector.Pulp_Paper] = 1200;
        sectorTargets[Sector.Textiles] = 400;
    }

    // ==================== ADMIN & REGISTRATION ====================

    function accreditAuditor(address _auditor) external onlyBEE {
        accreditedAuditors[_auditor] = true;
    }

    function setSectorTarget(Sector _sector, uint256 _target) external onlyBEE {
        sectorTargets[_sector] = _target;
    }

    function registerGreenProject(string memory _gps, string memory _species, uint256 _area) external {
        require(!gpsUsed[_gps], "GPS exists");
        greenProjects[msg.sender] = GreenProject(msg.sender, _gps, _species, _area, 0, block.timestamp, true);
        gpsUsed[_gps] = true;
        projectOwners.push(msg.sender);
        emit ProjectRegistered(msg.sender, _gps);
    }

    function registerOrganization(string memory _name, Sector _sector, uint256 _prod) external {
        require(!organizations[msg.sender].isRegistered, "Exists");
        organizations[msg.sender] = Organization(_name, _sector, sectorTargets[_sector], 0, _prod, true, true, 0);
        orgAddresses.push(msg.sender);
        emit OrganizationRegistered(msg.sender, _sector);
    }

    // ==================== AUDIT & REWARD LOGIC ====================

    function updateOrganizationEmissions(
        address _org,
        uint256 _coal, 
        uint256 _elec, 
        uint256 _lime, 
        uint256 _totalProd,
        uint256 _vintageYear
    ) external onlyAuditor {
        Organization storage org = organizations[_org];
        require(org.isRegistered, "Not registered");

      // totalEmissions is in KG
    uint256 totalEmissions = (_coal * 2500) + (_elec * 1) + (_lime * 440);

    // REMOVED * 1000: Now result is in KG per Tonne (e.g., 1544)
    // This now matches your TargetGEI (2100)
    org.actualGEI = totalEmissions / _totalProd; 

    org.annualProduction = _totalProd;
    org.isCompliant = org.actualGEI <= org.targetGEI;

    uint256 reward = 0;
    if (org.isCompliant) {
        uint256 savingsGEI = org.targetGEI - org.actualGEI; // 2100 - 1544 = 556

        // reward = (556 kg saved/tonne * 20,000 tonnes * 10^18) / 1000 (to get Metric Tonnes)
        // Result: 11,120 * 10^18 (Perfectly realistic)
        reward = (savingsGEI * _totalProd * SCALE) / 1000;

        if (reward > 0) {
            _mint(_org, reward, _vintageYear);
        }
    }

        auditHistory.push(AuditEntry(msg.sender, _org, "Industry Audit", org.actualGEI, block.timestamp));
        emit ComplianceUpdated(_org, org.actualGEI, org.isCompliant, reward);
    }

   /**
 * @dev Calculates and issues carbon credits.
 * Formula: (DBH * H * Count * Factor * 50 * 367) / 10^12
 * This ensures that 500 trees (250mm DBH, 1500cm H, 0.60 factor)
 * results in 206.4375 ICC.
 */
function issueCreditsToProject(
    address _owner, 
    uint256 _dbh, 
    uint256 _h, 
    uint256 _count, 
    uint256 _factor, 
    uint256 _year
) external onlyAuditor {
    // 1. Calculate the raw product of all variables and constants.
    // 2. Multiply by SCALE (1e18) before dividing to preserve 18-decimal precision.
    // 3. Divide by 1,000,000,000,000 (10^12) to correct for integer scaling and metric units.

    uint256 co2 = (_dbh * _h * _count * _factor * 50 * 367 * SCALE) / 1000000000000;

    // Mint the tokens to the owner
    _mint(_owner, co2, _year);

    // Update project state
    greenProjects[_owner].cumulativeCreditsIssued += co2;

    // Log the audit
    auditHistory.push(AuditEntry(
        msg.sender, 
        _owner, 
        "Forestry Audit", 
        co2, 
        block.timestamp
    ));
}

    // ==================== MARKETPLACE FUNCTIONS ====================

    function postBuyRequest(uint256 _tonnesNeeded) external {
        require(organizations[msg.sender].isRegistered, "Only Orgs");
        marketRequests.push(PurchaseRequest(msg.sender, _tonnesNeeded, false));
        emit BuyRequestCreated(marketRequests.length - 1, msg.sender, _tonnesNeeded);
    }

    function fulfillRequest(uint256 _requestId) external {
        PurchaseRequest storage req = marketRequests[_requestId];
        require(!req.isFullfilled, "Already done");
        uint256 amountTokens = req.amountInTonnes * SCALE;
        require(balanceOf[msg.sender] >= amountTokens, "Low balance");

        req.isFullfilled = true;
        _transfer(msg.sender, req.buyer, amountTokens);
        emit RequestFulfilled(_requestId, msg.sender, req.buyer, req.amountInTonnes);
    }

    function settleCompliance(uint256 _year) external {
        Organization storage org = organizations[msg.sender];
        require(org.actualGEI > org.targetGEI, "Already compliant");

        // FIX 3: Multiply by SCALE (1e18) before dividing by 1000
        uint256 tokensNeeded = ((org.actualGEI - org.targetGEI) * org.annualProduction * SCALE) / 1000;

        _burnFromOldestVintage(msg.sender, tokensNeeded);
        org.isCompliant = true;
        org.lastSettlementYear = _year;

        emit ComplianceSettled(msg.sender, tokensNeeded, _year);
    }

    // ==================== VIEW FUNCTIONS ====================

    // FIX 4: Frontend-facing shortfall needs to be scaled to 1e18
    function calculateShortfall(address _org) external view returns (uint256) {
        Organization memory org = organizations[_org];
        if (org.actualGEI <= org.targetGEI) return 0;
        return ((org.actualGEI - org.targetGEI) * org.annualProduction * SCALE) / 1000;
    }

    function getAuditHistory() external view returns (AuditEntry[] memory) {
        return auditHistory;
    }

    function getAllProjectOwners() external view returns (address[] memory) {
        return projectOwners;
    }

    function getAllOrgs() external view returns (address[] memory) {
        return orgAddresses;
    }

    function getMarketRequestCount() external view returns (uint256) {
        return marketRequests.length;
    }

    // ==================== INTERNAL ERC-20 HELPERS ====================

    function _mint(address _to, uint256 _amt, uint256 _year) internal {
        totalSupply += _amt;
        balanceOf[_to] += _amt;
        vintageBalances[_to][_year] += _amt;
        emit Transfer(address(0), _to, _amt);
    }

    function _transfer(address _from, address _to, uint256 _amt) internal returns (bool) {
        require(balanceOf[_from] >= _amt, "Balance low");
        balanceOf[_from] -= _amt;
        balanceOf[_to] += _amt;

        uint256 rem = _amt;
        for (uint256 y = 2020; y <= 2050 && rem > 0; y++) {
            uint256 avail = vintageBalances[_from][y];
            if (avail > 0) {
                uint256 take = avail < rem ? avail : rem;
                vintageBalances[_from][y] -= take;
                vintageBalances[_to][y] += take;
                rem -= take;
                emit VintageTransfer(_from, _to, take, y);
            }
        }
        emit Transfer(_from, _to, _amt);
        return true;
    }

    function _burnFromOldestVintage(address _from, uint256 _amt) internal {
        balanceOf[_from] -= _amt;
        totalSupply -= _amt;
        uint256 rem = _amt;
        for (uint256 y = 2020; y <= 2050 && rem > 0; y++) {
            uint256 avail = vintageBalances[_from][y];
            if (avail > 0) {
                uint256 take = avail < rem ? avail : rem;
                vintageBalances[_from][y] -= take;
                rem -= take;
                emit CreditsBurned(_from, take, y);
            }
        }
    }
}
