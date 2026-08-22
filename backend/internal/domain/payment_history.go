package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type PaymentHistory struct {
	ID               uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ScheduleID       uuid.UUID       `json:"schedule_id" gorm:"type:uuid;not null"`
	PaymentSchedule  PaymentSchedule `json:"payment_schedule,omitempty" gorm:"foreignKey:ScheduleID"`
	PaymentDate      time.Time       `json:"payment_date" gorm:"not null"`
	PaymentAmount    float64         `json:"payment_amount" gorm:"not null"`
	PaymentReference string          `json:"payment_reference"`
	PaymentMethod    string          `json:"payment_method"`
	PaymentProof     string          `json:"payment_proof"`
	Notes            string          `json:"notes"`
	PaidBy           int64           `json:"paid_by"`
	User             *User           `json:"user,omitempty" gorm:"foreignKey:PaidBy"`
	CreatedAt        time.Time       `json:"created_at"`
}

type MarkAsPaidRequest struct {
	ScheduleID       uuid.UUID `json:"schedule_id" binding:"required"`
	PaymentDate      string    `json:"payment_date" binding:"required"` // YYYY-MM-DD
	PaymentAmount    float64   `json:"payment_amount" binding:"required,gt=0"`
	PaymentReference string    `json:"payment_reference"`
	PaymentMethod    string    `json:"payment_method"`
	PaymentProof     string    `json:"payment_proof"`
	Notes            string    `json:"notes"`
}

type BulkMarkAsPaidRequest struct {
	ScheduleIDs      []uuid.UUID `json:"schedule_ids" binding:"required,min=1"`
	PaymentDate      string      `json:"payment_date" binding:"required"` // YYYY-MM-DD
	PaymentReference string      `json:"payment_reference"`
	PaymentMethod    string      `json:"payment_method"`
	PaymentProof     string      `json:"payment_proof"`
	Notes            string      `json:"notes"`
}

type PaymentHistoryRepository interface {
	Create(ctx context.Context, history *PaymentHistory) error
	GetByScheduleID(ctx context.Context, scheduleID uuid.UUID) ([]PaymentHistory, error)
}
