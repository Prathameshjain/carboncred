// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CarbonCredToken
 * @dev ERC-20 Carbon Credit Token integrated with CarbonCred ML verification system.
 * Modified from IndianCarbonCredit for CarbonCred marketplace integration.
 */
contract CarbonCredToken {

    // ==================== ERC-20 STANDARD ====================
    string public name = "CarbonCred Token";
    string public symbol = "CCT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    uint256 constant SCALE = 1e18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => mapping(uint256 => uint256)) public vintageBalances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event VintageTransfer(address indexed from, address indexed to, uint256 value, uint256 vintageYear);
    event CreditsBurned(address indexed account, uint256 amount, uint256 vintageYear);

    // ==================== ADMIN ROLES ====================
    address public admin;
    mapping(address => bool) public authorizedBackends;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedBackends[msg.sender] || msg.sender == admin, "Not authorized");
        _;
    }

    // ==================== PROJECT TRACKING ====================
    struct ProjectRecord {
        uint256 projectId;
        address owner;
        uint256 creditsIssued;
        uint256 vintageYear;
        bool exists;
    }

    mapping(uint256 => ProjectRecord) public projects;
    uint256[] public projectIds;

    event CreditsIssued(uint256 indexed projectId, address indexed owner, uint256 amount, uint256 vintageYear);

    // ==================== SELL ORDER ESCROW ====================
    struct SellOrderEscrow {
        address seller;
        uint256 credits;
        uint256 pricePerCredit; // in wei
        uint256 projectId;
        bool active;
    }

    mapping(uint256 => SellOrderEscrow) public sellOrders;
    uint256 public sellOrderCount;

    event SellOrderCreated(uint256 indexed orderId, address indexed seller, uint256 credits, uint256 pricePerCredit);
    event SellOrderExecuted(uint256 indexed orderId, address indexed buyer, uint256 creditsBought);
    event SellOrderCancelled(uint256 indexed orderId, address indexed seller, uint256 creditsReturned);

    // ==================== TRANSACTION LOGGING ====================
    struct TransactionRecord {
        uint256 orderId;
        address seller;
        address buyer;
        uint256 credits;
        uint256 timestamp;
    }

    TransactionRecord[] public transactionHistory;

    event TransactionLogged(uint256 indexed orderId, address indexed seller, address indexed buyer, uint256 credits);

    // ==================== CONSTRUCTOR ====================
    constructor() {
        admin = msg.sender;
        authorizedBackends[msg.sender] = true;
    }

    // ==================== ADMIN FUNCTIONS ====================

    function authorizeBackend(address _backend) external onlyAdmin {
        authorizedBackends[_backend] = true;
    }

    function revokeBackend(address _backend) external onlyAdmin {
        authorizedBackends[_backend] = false;
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
        authorizedBackends[_newAdmin] = true;
    }

    // ==================== CREDIT ISSUANCE (Backend-triggered after ML verification) ====================

    /**
     * @dev Mint credits to a wallet after project is verified by ML system.
     * Called by CarbonCred Django backend after ML verification passes.
     * 
     * @param _owner Wallet address of project owner (from Profile.metamask_wallet_address)
     * @param _amount Number of credits to issue (from calculate_credits_from_project)
     * @param _projectId Django Project model ID for tracking
     * @param _vintageYear Year of credit issuance
     */
    function mintVerifiedCredits(
        address _owner,
        uint256 _amount,
        uint256 _projectId,
        uint256 _vintageYear
    ) external onlyAuthorized {
        require(_owner != address(0), "Invalid owner");
        require(_amount > 0, "Amount must be positive");
        require(!projects[_projectId].exists, "Project already minted");

        // Mint tokens
        uint256 scaledAmount = _amount * SCALE;
        _mint(_owner, scaledAmount, _vintageYear);

        // Record project
        projects[_projectId] = ProjectRecord({
            projectId: _projectId,
            owner: _owner,
            creditsIssued: scaledAmount,
            vintageYear: _vintageYear,
            exists: true
        });
        projectIds.push(_projectId);

        emit CreditsIssued(_projectId, _owner, scaledAmount, _vintageYear);
    }

    // ==================== MARKETPLACE FUNCTIONS ====================

    /**
     * @dev Create a sell order (locks credits in escrow).
     * Called by CarbonCred Django backend when user creates a sell order.
     * 
     * @param _orderId Django SellOrder model ID
     * @param _seller Wallet address of seller
     * @param _credits Number of credits to sell
     * @param _pricePerCredit Price per credit in wei
     * @param _projectId Associated project ID
     */
    function createSellOrder(
        uint256 _orderId,
        address _seller,
        uint256 _credits,
        uint256 _pricePerCredit,
        uint256 _projectId
    ) external onlyAuthorized {
        uint256 scaledCredits = _credits * SCALE;
        require(balanceOf[_seller] >= scaledCredits, "Insufficient balance");
        require(!sellOrders[_orderId].active, "Order ID exists");

        // Lock credits in escrow (deduct from seller)
        balanceOf[_seller] -= scaledCredits;

        // Create sell order
        sellOrders[_orderId] = SellOrderEscrow({
            seller: _seller,
            credits: scaledCredits,
            pricePerCredit: _pricePerCredit,
            projectId: _projectId,
            active: true
        });
        sellOrderCount++;

        emit SellOrderCreated(_orderId, _seller, scaledCredits, _pricePerCredit);
        emit Transfer(_seller, address(this), scaledCredits);
    }

    /**
     * @dev Execute a purchase (transfer credits from escrow to buyer).
     * Called by CarbonCred Django backend when buyer purchases from sell order.
     * 
     * @param _orderId Django SellOrder model ID
     * @param _buyer Wallet address of buyer
     * @param _creditsToBuy Number of credits to buy
     */
    function executePurchase(
        uint256 _orderId,
        address _buyer,
        uint256 _creditsToBuy
    ) external onlyAuthorized {
        SellOrderEscrow storage order = sellOrders[_orderId];
        require(order.active, "Order not active");
        
        uint256 scaledCredits = _creditsToBuy * SCALE;
        require(order.credits >= scaledCredits, "Insufficient credits in order");
        require(_buyer != order.seller, "Cannot buy own order");

        // Deduct from escrow
        order.credits -= scaledCredits;

        // Transfer to buyer
        balanceOf[_buyer] += scaledCredits;

        // Update vintage balances (simplified - use current year)
        uint256 currentYear = (block.timestamp / 365 days) + 1970;
        vintageBalances[_buyer][currentYear] += scaledCredits;

        // Mark as sold if fully depleted
        if (order.credits == 0) {
            order.active = false;
        }

        // Log transaction
        transactionHistory.push(TransactionRecord({
            orderId: _orderId,
            seller: order.seller,
            buyer: _buyer,
            credits: scaledCredits,
            timestamp: block.timestamp
        }));

        emit SellOrderExecuted(_orderId, _buyer, scaledCredits);
        emit Transfer(address(this), _buyer, scaledCredits);
        emit TransactionLogged(_orderId, order.seller, _buyer, scaledCredits);
    }

    /**
     * @dev Cancel a sell order (return credits from escrow to seller).
     * Called by CarbonCred Django backend when seller cancels order.
     * 
     * @param _orderId Django SellOrder model ID
     */
    function cancelSellOrder(uint256 _orderId) external onlyAuthorized {
        SellOrderEscrow storage order = sellOrders[_orderId];
        require(order.active, "Order not active");

        uint256 remainingCredits = order.credits;
        
        // Return credits to seller
        balanceOf[order.seller] += remainingCredits;
        order.credits = 0;
        order.active = false;

        emit SellOrderCancelled(_orderId, order.seller, remainingCredits);
        emit Transfer(address(this), order.seller, remainingCredits);
    }

    /**
     * @dev Seller can also cancel their own order directly.
     */
    function cancelMySellOrder(uint256 _orderId) external {
        SellOrderEscrow storage order = sellOrders[_orderId];
        require(order.active, "Order not active");
        require(order.seller == msg.sender, "Not order owner");

        uint256 remainingCredits = order.credits;
        
        balanceOf[msg.sender] += remainingCredits;
        order.credits = 0;
        order.active = false;

        emit SellOrderCancelled(_orderId, msg.sender, remainingCredits);
        emit Transfer(address(this), msg.sender, remainingCredits);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getProjectRecord(uint256 _projectId) external view returns (ProjectRecord memory) {
        return projects[_projectId];
    }

    function getSellOrder(uint256 _orderId) external view returns (SellOrderEscrow memory) {
        return sellOrders[_orderId];
    }

    function getTransactionCount() external view returns (uint256) {
        return transactionHistory.length;
    }

    function getTransaction(uint256 _index) external view returns (TransactionRecord memory) {
        require(_index < transactionHistory.length, "Index out of bounds");
        return transactionHistory[_index];
    }

    function getProjectCount() external view returns (uint256) {
        return projectIds.length;
    }

    function getBalanceInCredits(address _owner) external view returns (uint256) {
        return balanceOf[_owner] / SCALE;
    }

    // ==================== ERC-20 STANDARD FUNCTIONS ====================

    function transfer(address _to, uint256 _amount) external returns (bool) {
        return _transfer(msg.sender, _to, _amount);
    }

    function approve(address _spender, uint256 _amount) external returns (bool) {
        allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _amount) external returns (bool) {
        require(allowance[_from][msg.sender] >= _amount, "Allowance exceeded");
        allowance[_from][msg.sender] -= _amount;
        return _transfer(_from, _to, _amount);
    }

    // ==================== INTERNAL FUNCTIONS ====================

    function _mint(address _to, uint256 _amt, uint256 _year) internal {
        totalSupply += _amt;
        balanceOf[_to] += _amt;
        vintageBalances[_to][_year] += _amt;
        emit Transfer(address(0), _to, _amt);
    }

    function _transfer(address _from, address _to, uint256 _amt) internal returns (bool) {
        require(balanceOf[_from] >= _amt, "Balance low");
        require(_to != address(0), "Invalid recipient");
        
        balanceOf[_from] -= _amt;
        balanceOf[_to] += _amt;

        // Transfer vintage balances (FIFO from oldest)
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

    function _burn(address _from, uint256 _amt) internal {
        require(balanceOf[_from] >= _amt, "Balance low");
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
        
        emit Transfer(_from, address(0), _amt);
    }

    /**
     * @dev Burn credits (for retirement/offset claims)
     */
    function burnCredits(uint256 _amount) external {
        uint256 scaledAmount = _amount * SCALE;
        _burn(msg.sender, scaledAmount);
    }
}
