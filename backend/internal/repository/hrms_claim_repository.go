package repository

import (
	"context"
	"strings"

	"finance-webapps/backend/internal/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type hrmsClaimRepository struct {
	db *gorm.DB
}

func NewHRMSClaimRepository(db *gorm.DB) domain.HRMSClaimRepository {
	_ = db.AutoMigrate(&domain.HRMSClaim{})
	return &hrmsClaimRepository{db: db}
}

func (r *hrmsClaimRepository) GetAll(ctx context.Context, filter domain.HRMSClaimFilter) ([]domain.HRMSClaim, int64, error) {
	var claims []domain.HRMSClaim
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.HRMSClaim{})

	if filter.SourceType != "" && filter.SourceType != "ALL" {
		query = query.Where("source_type = ?", filter.SourceType)
	}

	if filter.Status != "" && filter.Status != "ALL" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.Priority != "" && filter.Priority != "ALL" {
		query = query.Where("priority = ?", filter.Priority)
	}

	if filter.StartDate != "" {
		query = query.Where("created_at >= ?", filter.StartDate+" 00:00:00")
	}

	if filter.EndDate != "" {
		query = query.Where("created_at <= ?", filter.EndDate+" 23:59:59")
	}

	if filter.Search != "" {
		searchPattern := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where(
			"LOWER(title) LIKE ? OR LOWER(employee_name) LIKE ? OR LOWER(reference_no) LIKE ? OR LOWER(department) LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern,
		)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 15
	}
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&claims).Error
	return claims, total, err
}

func (r *hrmsClaimRepository) GetByID(ctx context.Context, id uint) (*domain.HRMSClaim, error) {
	var claim domain.HRMSClaim
	err := r.db.WithContext(ctx).First(&claim, id).Error
	if err != nil {
		return nil, err
	}
	return &claim, nil
}

func (r *hrmsClaimRepository) Create(ctx context.Context, claim *domain.HRMSClaim) error {
	return r.db.WithContext(ctx).Create(claim).Error
}

func (r *hrmsClaimRepository) Update(ctx context.Context, claim *domain.HRMSClaim) error {
	return r.db.WithContext(ctx).Save(claim).Error
}

func (r *hrmsClaimRepository) BatchUpsert(ctx context.Context, claims []domain.HRMSClaim) error {
	if len(claims) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "reference_no"}},
		DoUpdates: clause.AssignmentColumns([]string{"amount", "status", "approved_by", "approved_at", "updated_at", "items", "attachments"}),
	}).Create(&claims).Error
}

func (r *hrmsClaimRepository) GetSummary(ctx context.Context) (*domain.HRMSClaimSummary, error) {
	summary := &domain.HRMSClaimSummary{}

	// Total
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Count(&summary.TotalCount)
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Select("COALESCE(SUM(amount), 0)").Scan(&summary.TotalAmount)

	// Reimbursement
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("source_type = ?", "REIMBURSEMENT").Count(&summary.ReimbursementCount)
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("source_type = ?", "REIMBURSEMENT").Select("COALESCE(SUM(amount), 0)").Scan(&summary.ReimbursementAmount)

	// Fund Request
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("source_type = ?", "FUND_REQUEST").Count(&summary.FundRequestCount)
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("source_type = ?", "FUND_REQUEST").Select("COALESCE(SUM(amount), 0)").Scan(&summary.FundRequestAmount)

	// Pending
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("status = ?", "PENDING").Count(&summary.PendingCount)
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("status = ?", "PENDING").Select("COALESCE(SUM(amount), 0)").Scan(&summary.PendingAmount)

	// Approved (ready to disburse)
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("status = ?", "APPROVED").Count(&summary.ApprovedCount)
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("status = ?", "APPROVED").Select("COALESCE(SUM(amount), 0)").Scan(&summary.ApprovedAmount)

	// Disbursed
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("status = ?", "DISBURSED").Count(&summary.DisbursedCount)
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("status = ?", "DISBURSED").Select("COALESCE(SUM(amount), 0)").Scan(&summary.DisbursedAmount)

	// Rejected
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("status = ?", "REJECTED").Count(&summary.RejectedCount)
	r.db.WithContext(ctx).Model(&domain.HRMSClaim{}).Where("status = ?", "REJECTED").Select("COALESCE(SUM(amount), 0)").Scan(&summary.RejectedAmount)

	return summary, nil
}
