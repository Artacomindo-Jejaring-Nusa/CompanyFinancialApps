package repository

import (
	"context"

	"finance-webapps/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type serviceRepository struct {
	db *gorm.DB
}

func NewServiceRepository(db *gorm.DB) domain.ServiceRepository {
	return &serviceRepository{db: db}
}

func (r *serviceRepository) GetAll(ctx context.Context, filter domain.ServiceFilter) ([]domain.Service, int64, error) {
	var services []domain.Service
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.Service{}).
		Preload("ServiceType").
		Preload("Customer").
		Preload("Provider")

	if filter.Search != "" {
		s := "%" + filter.Search + "%"
		query = query.Where("service_name ILIKE ? OR cid ILIKE ? OR site_id ILIKE ? OR site_name ILIKE ? OR location ILIKE ?", s, s, s, s, s)
	}

	if filter.ServiceTypeID > 0 {
		query = query.Where("service_type_id = ?", filter.ServiceTypeID)
	}

	if filter.CustomerID > 0 {
		query = query.Where("customer_id = ?", filter.CustomerID)
	}

	if filter.ProviderID > 0 {
		query = query.Where("provider_id = ?", filter.ProviderID)
	}

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.BillingCycle != "" {
		query = query.Where("billing_cycle = ?", filter.BillingCycle)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&services).Error
	return services, total, err
}

func (r *serviceRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Service, error) {
	var s domain.Service
	err := r.db.WithContext(ctx).
		Preload("ServiceType").
		Preload("Customer").
		Preload("Provider").
		First(&s, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *serviceRepository) Create(ctx context.Context, service *domain.Service) error {
	return r.db.WithContext(ctx).Create(service).Error
}

func (r *serviceRepository) Update(ctx context.Context, service *domain.Service) error {
	return r.db.WithContext(ctx).Save(service).Error
}

func (r *serviceRepository) Archive(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&domain.Service{}).Where("id = ?", id).Update("status", "EXPIRED").Error
}
