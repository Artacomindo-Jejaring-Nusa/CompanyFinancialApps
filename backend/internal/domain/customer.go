package domain

import (
	"context"
	"time"
)

type Customer struct {
	ID           int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	CustomerCode string    `json:"customer_code" gorm:"unique;not null"`
	CustomerName string    `json:"customer_name" gorm:"not null"`
	Contact      string    `json:"contact"`
	Status       string    `json:"status" gorm:"default:'ACTIVE'"`
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CustomerFilter struct {
	Search string
	Status string
	Page   int
	Limit  int
}

type CustomerRepository interface {
	GetAll(ctx context.Context, filter CustomerFilter) ([]Customer, int64, error)
	GetByID(ctx context.Context, id int64) (*Customer, error)
	GetByCode(ctx context.Context, code string) (*Customer, error)
	Create(ctx context.Context, customer *Customer) error
	Update(ctx context.Context, customer *Customer) error
	Delete(ctx context.Context, id int64) error
}

type CustomerUsecase interface {
	GetAll(ctx context.Context, filter CustomerFilter) ([]Customer, int64, error)
	GetByID(ctx context.Context, id int64) (*Customer, error)
	Create(ctx context.Context, customer *Customer) error
	Update(ctx context.Context, id int64, customer *Customer) error
	Delete(ctx context.Context, id int64) error
}
