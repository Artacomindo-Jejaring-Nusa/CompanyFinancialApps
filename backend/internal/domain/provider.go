package domain

import (
	"context"
	"time"
)

type Provider struct {
	ID           int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProviderCode string    `json:"provider_code" gorm:"unique;not null"`
	ProviderName string    `json:"provider_name" gorm:"not null"`
	Contact      string    `json:"contact"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	Address      string    `json:"address"`
	Status       string    `json:"status" gorm:"default:'ACTIVE'"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ProviderFilter struct {
	Search string
	Status string
	Page   int
	Limit  int
}

type ProviderRepository interface {
	GetAll(ctx context.Context, filter ProviderFilter) ([]Provider, int64, error)
	GetByID(ctx context.Context, id int64) (*Provider, error)
	GetByCode(ctx context.Context, code string) (*Provider, error)
	Create(ctx context.Context, provider *Provider) error
	Update(ctx context.Context, provider *Provider) error
	Delete(ctx context.Context, id int64) error
}

type ProviderUsecase interface {
	GetAll(ctx context.Context, filter ProviderFilter) ([]Provider, int64, error)
	GetByID(ctx context.Context, id int64) (*Provider, error)
	Create(ctx context.Context, provider *Provider) error
	Update(ctx context.Context, id int64, provider *Provider) error
	Delete(ctx context.Context, id int64) error
}
