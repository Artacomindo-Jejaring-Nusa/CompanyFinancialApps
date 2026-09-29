package domain

import (
	"context"
	"time"
)

type HRMSClaim struct {
	ID            uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	SourceType    string     `json:"source_type" gorm:"size:30;not null;index"` // REIMBURSEMENT or FUND_REQUEST
	ReferenceNo   string     `json:"reference_no" gorm:"size:64;uniqueIndex"`
	EmployeeName  string     `json:"employee_name" gorm:"size:128;not null"`
	EmployeeEmail string     `json:"employee_email" gorm:"size:128"`
	Department    string     `json:"department" gorm:"size:100"`
	Title         string     `json:"title" gorm:"size:255;not null"`
	Description   string     `json:"description" gorm:"type:text"`
	Amount        float64    `json:"amount" gorm:"type:decimal(15,2);not null"`
	Status        string     `json:"status" gorm:"size:30;not null;default:'PENDING';index"` // PENDING, APPROVED, REJECTED, DISBURSED
	Priority      string     `json:"priority" gorm:"size:20;default:'Normal'"`               // Normal, High, Urgent
	ApprovedBy    string     `json:"approved_by" gorm:"size:128"`
	ApprovedAt    *time.Time `json:"approved_at"`
	DisbursedAt   *time.Time `json:"disbursed_at"`
	DisbursedBy   string     `json:"disbursed_by" gorm:"size:128"`
	DisbursedRef  string     `json:"disbursed_ref" gorm:"size:64"`
	Items         string     `json:"items" gorm:"type:text"`       // JSON string of breakdown items
	Attachments   string     `json:"attachments" gorm:"type:text"` // JSON string of attachment URLs/paths
	CreatedAt     time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

type HRMSClaimFilter struct {
	SourceType string `form:"source_type"`
	Status     string `form:"status"`
	Priority   string `form:"priority"`
	Search     string `form:"search"`
	StartDate  string `form:"start_date"`
	EndDate    string `form:"end_date"`
	Page       int    `form:"page,default=1"`
	Limit      int    `form:"limit,default=15"`
}

type HRMSClaimSummary struct {
	TotalCount           int64   `json:"total_count"`
	TotalAmount          float64 `json:"total_amount"`
	ReimbursementCount   int64   `json:"reimbursement_count"`
	ReimbursementAmount  float64 `json:"reimbursement_amount"`
	FundRequestCount     int64   `json:"fund_request_count"`
	FundRequestAmount    float64 `json:"fund_request_amount"`
	PendingCount         int64   `json:"pending_count"`
	PendingAmount        float64 `json:"pending_amount"`
	ApprovedCount        int64   `json:"approved_count"`
	ApprovedAmount       float64 `json:"approved_amount"`
	DisbursedCount       int64   `json:"disbursed_count"`
	DisbursedAmount      float64 `json:"disbursed_amount"`
	RejectedCount        int64   `json:"rejected_count"`
	RejectedAmount       float64 `json:"rejected_amount"`
}

type DisburseClaimRequest struct {
	DisbursedBy  string `json:"disbursed_by" binding:"required"`
	DisbursedRef string `json:"disbursed_ref" binding:"required"`
	Notes        string `json:"notes"`
}

type SyncHrmsRequest struct {
	HrmsBaseURL string `json:"hrms_base_url"`
	APIToken    string `json:"api_token"`
}

type HRMSClaimRepository interface {
	GetAll(ctx context.Context, filter HRMSClaimFilter) ([]HRMSClaim, int64, error)
	GetByID(ctx context.Context, id uint) (*HRMSClaim, error)
	Create(ctx context.Context, claim *HRMSClaim) error
	Update(ctx context.Context, claim *HRMSClaim) error
	BatchUpsert(ctx context.Context, claims []HRMSClaim) error
	GetSummary(ctx context.Context) (*HRMSClaimSummary, error)
}

type HRMSClaimUsecase interface {
	GetAll(ctx context.Context, filter HRMSClaimFilter) ([]HRMSClaim, int64, error)
	GetByID(ctx context.Context, id uint) (*HRMSClaim, error)
	GetSummary(ctx context.Context) (*HRMSClaimSummary, error)
	Disburse(ctx context.Context, id uint, req DisburseClaimRequest, userID int64) (*HRMSClaim, error)
	SyncFromHRMS(ctx context.Context, req SyncHrmsRequest) (int, error)
}
