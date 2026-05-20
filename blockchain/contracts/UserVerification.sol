// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title UserVerification
 * @dev Smart contract ghi lại xác thực tài khoản người dùng on-chain
 * Mỗi user sẽ có một instance riêng của contract này
 */
contract UserVerification {
    address public owner;
    string public userId;
    string public userEmail;
    
    enum KYCStatus {
        UNVERIFIED,
        PENDING,
        VERIFIED,
        REJECTED
    }
    
    struct VerificationRecord {
        KYCStatus status;
        string documentHash;      // Hash của tài liệu KYC (CCCD/CMND)
        string identityHash;       // Hash thông tin định danh
        uint256 verifiedAt;
        uint256 updatedAt;
        address verifiedBy;        // Admin/verifier address
        string metadata;           // Additional metadata (JSON)
    }
    
    VerificationRecord public verificationRecord;
    
    // Events cho audit trail
    event VerificationRequested(address indexed user, string userId, string documentHash);
    event VerificationApproved(address indexed user, address indexed verifiedBy, uint256 timestamp);
    event VerificationRejected(address indexed user, address indexed verifiedBy, string reason);
    event StatusUpdated(address indexed user, KYCStatus oldStatus, KYCStatus newStatus);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Constructor - khởi tạo contract cho user
     * @param _userId ID của user trong hệ thống
     * @param _userEmail Email của user
     * @param _documentHash Hash của tài liệu KYC ban đầu
     */
    constructor(string memory _userId, string memory _userEmail, string memory _documentHash) {
        owner = msg.sender;
        userId = _userId;
        userEmail = _userEmail;
        
        verificationRecord = VerificationRecord({
            status: KYCStatus.PENDING,
            documentHash: _documentHash,
            identityHash: "",
            verifiedAt: 0,
            updatedAt: block.timestamp,
            verifiedBy: address(0),
            metadata: ""
        });
        
        emit VerificationRequested(msg.sender, _userId, _documentHash);
    }
    
    /**
     * @dev Cập nhật trạng thái verification (chỉ owner/admin)
     * @param _status Trạng thái mới
     * @param _identityHash Hash thông tin định danh
     * @param _metadata Metadata thêm
     */
    function updateVerificationStatus(
        KYCStatus _status,
        string memory _identityHash,
        string memory _metadata
    ) external onlyOwner {
        KYCStatus oldStatus = verificationRecord.status;
        
        verificationRecord.status = _status;
        verificationRecord.identityHash = _identityHash;
        verificationRecord.metadata = _metadata;
        verificationRecord.updatedAt = block.timestamp;
        verificationRecord.verifiedBy = msg.sender;
        
        if (_status == KYCStatus.VERIFIED) {
            verificationRecord.verifiedAt = block.timestamp;
            emit VerificationApproved(owner, msg.sender, block.timestamp);
        } else if (_status == KYCStatus.REJECTED) {
            emit VerificationRejected(owner, msg.sender, _metadata);
        }
        
        emit StatusUpdated(owner, oldStatus, _status);
    }
    
    /**
     * @dev Lấy thông tin verification
     */
    function getVerificationRecord() external view returns (VerificationRecord memory) {
        return verificationRecord;
    }
    
    /**
     * @dev Kiểm tra user đã verified chưa
     */
    function isVerified() external view returns (bool) {
        return verificationRecord.status == KYCStatus.VERIFIED;
    }
    
    /**
     * @dev Cập nhật document hash (khi user upload tài liệu mới)
     */
    function updateDocumentHash(string memory _documentHash) external onlyOwner {
        verificationRecord.documentHash = _documentHash;
        verificationRecord.updatedAt = block.timestamp;
    }
    
    /**
     * @dev Transfer ownership (cho trường hợp thay đổi admin)
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
