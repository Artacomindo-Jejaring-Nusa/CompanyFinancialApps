package repository

import (
	"context"

	"finance-webapps/backend/internal/domain"
	"gorm.io/gorm"
)

type auditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) domain.AuditLogRepository {
	return &auditLogRepository{db: db}
}

func (r *auditLogRepository) Create(ctx context.Context, log *domain.AuditLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *auditLogRepository) GetAll(ctx context.Context, entity string, entityID string, page, limit int) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.AuditLog{}).Preload("User")

	if entity != "" {
		query = query.Where("entity = ?", entity)
	}
	if entityID != "" {
		query = query.Where("entity_id = ?", entityID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("timestamp DESC").Find(&logs).Error
	return logs, total, err
}
