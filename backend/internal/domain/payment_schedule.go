package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Payment Schedule Statuses: UPCOMING, DUE, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
type PaymentSchedule struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ServiceID       uuid.UUID  `json:"service_id" gorm:"type:uuid;not null"`
	Service         Service    `json:"service" gorm:"foreignKey:ServiceID"`
	Period          string     `json:"period" gorm:"not null"` // YYYY-MM
	DueDate         time.Time  `json:"due_date" gorm:"not null"`
	Amount          float64    `json:"amount" gorm:"not null"`
	RemainingAmount float64    `json:"remaining_amount" gorm:"not null"`
	Status          string     `json:"status" gorm:"default:'UPCOMING'"`
	PaymentDate     *time.Time `json:"payment_date"`
	Notes           string     `json:"notes"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type PaymentScheduleFilter struct {
	Status        string // UPCOMING, DUE_TODAY, DUE_SOON, OVERDUE, PAID, ALL
	ServiceID     *uuid.UUID
	CustomerID    int64
	ProviderID    int64
	ServiceTypeID int64
	Search        string
	StartDate     *time.Time
	EndDate       *time.Time
	Page          int
	Limit         int
}

type PaymentScheduleRepository interface {
	GetAll(ctx context.Context, filter PaymentScheduleFilter) ([]PaymentSchedule, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*PaymentSchedule, error)
	GetByServiceAndPeriod(ctx context.Context, serviceID uuid.UUID, period string) (*PaymentSchedule, error)
	Create(ctx context.Context, schedule *PaymentSchedule) error
	Update(ctx context.Context, schedule *PaymentSchedule) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	BatchCreate(ctx context.Context, schedules []PaymentSchedule) error
}

type PaymentScheduleUsecase interface {
	GetAll(ctx context.Context, filter PaymentScheduleFilter) ([]PaymentSchedule, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*PaymentSchedule, error)
	GenerateSchedulesForService(ctx context.Context, service *Service) error
	MarkAsPaid(ctx context.Context, req MarkAsPaidRequest, userID int64) (*PaymentSchedule, error)
	BulkMarkAsPaid(ctx context.Context, req BulkMarkAsPaidRequest, userID int64) ([]uuid.UUID, []string, error)
}
