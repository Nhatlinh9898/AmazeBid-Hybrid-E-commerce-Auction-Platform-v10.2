// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EscrowTransaction
 * @dev Smart contract ghi lại giao dịch escrow on-chain
 * Mỗi user sẽ có một instance riêng để quản lý các giao dịch của họ
 */
contract EscrowTransaction {
    address public owner;
    string public userId;
    
    enum EscrowStatus {
        HELD,
        RELEASED,
        REFUNDED,
        DISPUTED
    }
    
    struct Transaction {
        string transactionId;       // ID giao dịch từ hệ thống
        string orderId;             // ID đơn hàng
        uint256 amount;             // Số tiền (in wei)
        string currency;            // Loại tiền tệ (VND, USD, etc.)
        EscrowStatus status;
        address buyer;              // Địa chỉ wallet người mua
        address seller;             // Địa chỉ wallet người bán
        uint256 createdAt;
        uint256 expectedReleaseDate; // Ngày dự kiến release
        uint256 releasedAt;
        uint256 platformFee;        // Phí sàn
        uint256 sellerAmount;       // Số tiền người bán nhận được
        string metadata;           // Additional metadata (JSON)
    }
    
    // Mapping từ transactionId đến Transaction
    mapping(string => Transaction) public transactions;
    
    // Array của tất cả transaction IDs
    string[] public transactionIds;
    
    // Events cho audit trail
    event TransactionCreated(
        string indexed transactionId,
        string indexed orderId,
        uint256 amount,
        address indexed buyer,
        address seller
    );
    
    event TransactionReleased(
        string indexed transactionId,
        uint256 sellerAmount,
        uint256 platformFee,
        uint256 timestamp
    );
    
    event TransactionRefunded(
        string indexed transactionId,
        uint256 amount,
        uint256 timestamp
    );
    
    event TransactionDisputed(
        string indexed transactionId,
        string reason,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Constructor - khởi tạo contract cho user
     * @param _userId ID của user trong hệ thống
     */
    constructor(string memory _userId) {
        owner = msg.sender;
        userId = _userId;
    }
    
    /**
     * @dev Tạo transaction escrow mới
     * @param _transactionId ID giao dịch
     * @param _orderId ID đơn hàng
     * @param _amount Số tiền
     * @param _currency Loại tiền tệ
     * @param _buyer Địa chỉ người mua
     * @param _seller Địa chỉ người bán
     * @param _expectedReleaseDate Ngày dự kiến release (timestamp)
     * @param _platformFee Phí sàn
     * @param _metadata Metadata
     */
    function createTransaction(
        string memory _transactionId,
        string memory _orderId,
        uint256 _amount,
        string memory _currency,
        address _buyer,
        address _seller,
        uint256 _expectedReleaseDate,
        uint256 _platformFee,
        string memory _metadata
    ) external onlyOwner {
        require(transactions[_transactionId].createdAt == 0, "Transaction already exists");
        require(_amount > 0, "Amount must be greater than 0");
        require(_buyer != address(0), "Invalid buyer address");
        require(_seller != address(0), "Invalid seller address");
        
        uint256 sellerAmount = _amount - _platformFee;
        
        transactions[_transactionId] = Transaction({
            transactionId: _transactionId,
            orderId: _orderId,
            amount: _amount,
            currency: _currency,
            status: EscrowStatus.HELD,
            buyer: _buyer,
            seller: _seller,
            createdAt: block.timestamp,
            expectedReleaseDate: _expectedReleaseDate,
            releasedAt: 0,
            platformFee: _platformFee,
            sellerAmount: sellerAmount,
            metadata: _metadata
        });
        
        transactionIds.push(_transactionId);
        
        emit TransactionCreated(_transactionId, _orderId, _amount, _buyer, _seller);
    }
    
    /**
     * @dev Release tiền từ escrow cho người bán
     * @param _transactionId ID giao dịch
     */
    function releaseTransaction(string memory _transactionId) external onlyOwner {
        Transaction storage txn = transactions[_transactionId];
        require(txn.createdAt != 0, "Transaction does not exist");
        require(txn.status == EscrowStatus.HELD, "Transaction not in HELD status");
        
        txn.status = EscrowStatus.RELEASED;
        txn.releasedAt = block.timestamp;
        
        emit TransactionReleased(_transactionId, txn.sellerAmount, txn.platformFee, block.timestamp);
    }
    
    /**
     * @dev Hoàn tiền cho người mua
     * @param _transactionId ID giao dịch
     */
    function refundTransaction(string memory _transactionId) external onlyOwner {
        Transaction storage txn = transactions[_transactionId];
        require(txn.createdAt != 0, "Transaction does not exist");
        require(txn.status == EscrowStatus.HELD, "Transaction not in HELD status");
        
        txn.status = EscrowStatus.REFUNDED;
        txn.releasedAt = block.timestamp;
        
        emit TransactionRefunded(_transactionId, txn.amount, block.timestamp);
    }
    
    /**
     * @dev Đánh dấu transaction đang có tranh chấp
     * @param _transactionId ID giao dịch
     * @param _reason Lý do tranh chấp
     */
    function disputeTransaction(string memory _transactionId, string memory _reason) external onlyOwner {
        Transaction storage txn = transactions[_transactionId];
        require(txn.createdAt != 0, "Transaction does not exist");
        require(txn.status == EscrowStatus.HELD, "Transaction not in HELD status");
        
        txn.status = EscrowStatus.DISPUTED;
        txn.metadata = _reason;
        
        emit TransactionDisputed(_transactionId, _reason, block.timestamp);
    }
    
    /**
     * @dev Lấy thông tin transaction
     */
    function getTransaction(string memory _transactionId) external view returns (Transaction memory) {
        require(transactions[_transactionId].createdAt != 0, "Transaction does not exist");
        return transactions[_transactionId];
    }
    
    /**
     * @dev Lấy tất cả transaction IDs
     */
    function getAllTransactionIds() external view returns (string[] memory) {
        return transactionIds;
    }
    
    /**
     * @dev Lấy số lượng transaction
     */
    function getTransactionCount() external view returns (uint256) {
        return transactionIds.length;
    }
    
    /**
     * @dev Lấy transaction theo trạng thái
     */
    function getTransactionsByStatus(EscrowStatus _status) external view returns (string[] memory) {
        string[] memory filteredIds = new string[](transactionIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < transactionIds.length; i++) {
            if (transactions[transactionIds[i]].status == _status) {
                filteredIds[count] = transactionIds[i];
                count++;
            }
        }
        
        // Resize array
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = filteredIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev Kiểm tra transaction có thể release tự động chưa
     */
    function canAutoRelease(string memory _transactionId) external view returns (bool) {
        Transaction memory txn = transactions[_transactionId];
        require(txn.createdAt != 0, "Transaction does not exist");
        
        return txn.status == EscrowStatus.HELD && block.timestamp >= txn.expectedReleaseDate;
    }
    
    /**
     * @dev Auto release transaction khi hết thời gian chờ
     */
    function autoReleaseTransaction(string memory _transactionId) external onlyOwner {
        Transaction storage txn = transactions[_transactionId];
        require(txn.createdAt != 0, "Transaction does not exist");
        require(txn.status == EscrowStatus.HELD, "Transaction not in HELD status");
        require(block.timestamp >= txn.expectedReleaseDate, "Release time not reached");
        
        txn.status = EscrowStatus.RELEASED;
        txn.releasedAt = block.timestamp;
        
        emit TransactionReleased(_transactionId, txn.sellerAmount, txn.platformFee, block.timestamp);
    }
    
    /**
     * @dev Cập nhật metadata của transaction
     */
    function updateTransactionMetadata(string memory _transactionId, string memory _metadata) external onlyOwner {
        Transaction storage txn = transactions[_transactionId];
        require(txn.createdAt != 0, "Transaction does not exist");
        
        txn.metadata = _metadata;
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
