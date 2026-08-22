package repository

import (
	"context"

	"finance-webapps/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type paymentHistoryRepository struct {
	db *gorm.DB
}

func NewPaymentHistoryRepository(db *gorm.DB) domain.PaymentHistoryRepository {
	return &paymentHistoryRepository{db: db}
}

func (r *paymentHistoryRepository) Create(ctx context.Context, history *domain.PaymentHistory) error {
	return r.db.WithContext(ctx).Create(history).Error
}

func (r *paymentHistoryRepository) GetByScheduleID(ctx context.Context, scheduleID uuid.UUID) ([]domain.PaymentHistory, error) {
	var histories []domain.PaymentHistory
	err := r.db.WithContext(ctx).Preload("User").Where("schedule_id = ?", scheduleID).Order("created_at DESC").Find(&histories).Error
	return histories, err
}
