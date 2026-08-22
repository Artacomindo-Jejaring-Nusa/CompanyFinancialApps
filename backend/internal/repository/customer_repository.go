package repository

import (
	"context"

	"finance-webapps/backend/internal/domain"
	"gorm.io/gorm"
)

type customerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) domain.CustomerRepository {
	return &customerRepository{db: db}
}

func (r *customerRepository) GetAll(ctx context.Context, filter domain.CustomerFilter) ([]domain.Customer, int64, error) {
	var customers []domain.Customer
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.Customer{})

	if filter.Search != "" {
		s := "%" + filter.Search + "%"
		query = query.Where("customer_code ILIKE ? OR customer_name ILIKE ?", s, s)
	}

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Offset(offset).Limit(filter.Limit).Order("id DESC").Find(&customers).Error
	return customers, total, err
}

func (r *customerRepository) GetByID(ctx context.Context, id int64) (*domain.Customer, error) {
	var customer domain.Customer
	err := r.db.WithContext(ctx).First(&customer, id).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) GetByCode(ctx context.Context, code string) (*domain.Customer, error) {
	var customer domain.Customer
	err := r.db.WithContext(ctx).Where("customer_code = ?", code).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) Create(ctx context.Context, customer *domain.Customer) error {
	return r.db.WithContext(ctx).Create(customer).Error
}

func (r *customerRepository) Update(ctx context.Context, customer *domain.Customer) error {
	return r.db.WithContext(ctx).Save(customer).Error
}

func (r *customerRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&domain.Customer{}, id).Error
}
