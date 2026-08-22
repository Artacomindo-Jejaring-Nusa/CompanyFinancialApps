package repository

import (
	"context"

	"finance-webapps/backend/internal/domain"
	"gorm.io/gorm"
)

type serviceTypeRepository struct {
	db *gorm.DB
}

func NewServiceTypeRepository(db *gorm.DB) domain.ServiceTypeRepository {
	return &serviceTypeRepository{db: db}
}

func (r *serviceTypeRepository) GetAll(ctx context.Context) ([]domain.ServiceType, error) {
	var st []domain.ServiceType
	err := r.db.WithContext(ctx).Order("id ASC").Find(&st).Error
	return st, err
}

func (r *serviceTypeRepository) GetByID(ctx context.Context, id int64) (*domain.ServiceType, error) {
	var st domain.ServiceType
	err := r.db.WithContext(ctx).First(&st, id).Error
	if err != nil {
		return nil, err
	}
	return &st, nil
}

func (r *serviceTypeRepository) Create(ctx context.Context, st *domain.ServiceType) error {
	return r.db.WithContext(ctx).Create(st).Error
}

func (r *serviceTypeRepository) Update(ctx context.Context, st *domain.ServiceType) error {
	return r.db.WithContext(ctx).Save(st).Error
}

func (r *serviceTypeRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&domain.ServiceType{}, id).Error
}
