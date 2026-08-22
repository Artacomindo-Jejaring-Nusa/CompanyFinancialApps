package repository

import (
	"context"

	"finance-webapps/backend/internal/domain"
	"gorm.io/gorm"
)

type providerRepository struct {
	db *gorm.DB
}

func NewProviderRepository(db *gorm.DB) domain.ProviderRepository {
	return &providerRepository{db: db}
}

func (r *providerRepository) GetAll(ctx context.Context, filter domain.ProviderFilter) ([]domain.Provider, int64, error) {
	var providers []domain.Provider
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.Provider{})

	if filter.Search != "" {
		s := "%" + filter.Search + "%"
		query = query.Where("provider_code ILIKE ? OR provider_name ILIKE ?", s, s)
	}

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Offset(offset).Limit(filter.Limit).Order("id DESC").Find(&providers).Error
	return providers, total, err
}

func (r *providerRepository) GetByID(ctx context.Context, id int64) (*domain.Provider, error) {
	var provider domain.Provider
	err := r.db.WithContext(ctx).First(&provider, id).Error
	if err != nil {
		return nil, err
	}
	return &provider, nil
}

func (r *providerRepository) GetByCode(ctx context.Context, code string) (*domain.Provider, error) {
	var provider domain.Provider
	err := r.db.WithContext(ctx).Where("provider_code = ?", code).First(&provider).Error
	if err != nil {
		return nil, err
	}
	return &provider, nil
}

func (r *providerRepository) Create(ctx context.Context, provider *domain.Provider) error {
	return r.db.WithContext(ctx).Create(provider).Error
}

func (r *providerRepository) Update(ctx context.Context, provider *domain.Provider) error {
	return r.db.WithContext(ctx).Save(provider).Error
}

func (r *providerRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&domain.Provider{}, id).Error
}
