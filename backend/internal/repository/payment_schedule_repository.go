package repository

import (
	"context"
	"time"

	"finance-webapps/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type paymentScheduleRepository struct {
	db *gorm.DB
}

func NewPaymentScheduleRepository(db *gorm.DB) domain.PaymentScheduleRepository {
	return &paymentScheduleRepository{db: db}
}

func (r *paymentScheduleRepository) GetAll(ctx context.Context, filter domain.PaymentScheduleFilter) ([]domain.PaymentSchedule, int64, error) {
	var schedules []domain.PaymentSchedule
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
		Preload("Service").
		Preload("Service.Customer").
		Preload("Service.Provider").
		Preload("Service.ServiceType")

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Apply Status Filters according to PRD
	switch filter.Status {
	case "UPCOMING":
		query = query.Where("status = ?", "UPCOMING")
	case "DUE_TODAY":
		query = query.Where("due_date = ? AND status NOT IN ('PAID', 'CANCELLED')", today)
	case "DUE_SOON":
		sevenDaysLater := today.AddDate(0, 0, 7)
		query = query.Where("due_date >= ? AND due_date <= ? AND status NOT IN ('PAID', 'CANCELLED')", today, sevenDaysLater)
	case "OVERDUE":
		query = query.Where("(due_date < ? AND status NOT IN ('PAID', 'CANCELLED')) OR status = 'OVERDUE'", today)
	case "PAID":
		query = query.Where("status = ?", "PAID")
	case "PARTIALLY_PAID":
		query = query.Where("status = ?", "PARTIALLY_PAID")
	}

	if filter.ServiceID != nil {
		query = query.Where("service_id = ?", *filter.ServiceID)
	}

	if filter.CustomerID > 0 || filter.ProviderID > 0 || filter.ServiceTypeID > 0 || filter.Search != "" {
		query = query.Joins("JOIN services ON services.id = payment_schedules.service_id")

		if filter.CustomerID > 0 {
			query = query.Where("services.customer_id = ?", filter.CustomerID)
		}
		if filter.ProviderID > 0 {
			query = query.Where("services.provider_id = ?", filter.ProviderID)
		}
		if filter.ServiceTypeID > 0 {
			query = query.Where("services.service_type_id = ?", filter.ServiceTypeID)
		}
		if filter.Search != "" {
			s := "%" + filter.Search + "%"
			query = query.Where("services.service_name ILIKE ? OR services.cid ILIKE ? OR services.site_id ILIKE ?", s, s, s)
		}
	}

	if filter.StartDate != nil {
		query = query.Where("payment_schedules.due_date >= ?", filter.StartDate)
	}
	if filter.EndDate != nil {
		query = query.Where("payment_schedules.due_date <= ?", filter.EndDate)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Offset(offset).Limit(filter.Limit).Order("due_date ASC").Find(&schedules).Error
	return schedules, total, err
}

func (r *paymentScheduleRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.PaymentSchedule, error) {
	var ps domain.PaymentSchedule
	err := r.db.WithContext(ctx).
		Preload("Service").
		Preload("Service.Customer").
		Preload("Service.Provider").
		Preload("Service.ServiceType").
		First(&ps, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &ps, nil
}

func (r *paymentScheduleRepository) GetByServiceAndPeriod(ctx context.Context, serviceID uuid.UUID, period string) (*domain.PaymentSchedule, error) {
	var ps domain.PaymentSchedule
	err := r.db.WithContext(ctx).Where("service_id = ? AND period = ?", serviceID, period).First(&ps).Error
	if err != nil {
		return nil, err
	}
	return &ps, nil
}

func (r *paymentScheduleRepository) Create(ctx context.Context, schedule *domain.PaymentSchedule) error {
	return r.db.WithContext(ctx).Create(schedule).Error
}

func (r *paymentScheduleRepository) Update(ctx context.Context, schedule *domain.PaymentSchedule) error {
	return r.db.WithContext(ctx).Save(schedule).Error
}

func (r *paymentScheduleRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	return r.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).Where("id = ?", id).Update("status", status).Error
}

func (r *paymentScheduleRepository) BatchCreate(ctx context.Context, schedules []domain.PaymentSchedule) error {
	if len(schedules) == 0 {
		return nil
	}
	// Use ON CONFLICT DO NOTHING for idempotency
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&schedules).Error
}
