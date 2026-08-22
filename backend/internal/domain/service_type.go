package domain

import (
	"context"
	"encoding/json"
	"time"
)

type ServiceType struct {
	ID              int64           `json:"id" gorm:"primaryKey;autoIncrement"`
	Name            string          `json:"name" gorm:"unique;not null"`
	AttributeSchema json.RawMessage `json:"attribute_schema" gorm:"type:jsonb;default:'[]'"`
	Status          string          `json:"status" gorm:"default:'ACTIVE'"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

type AttributeDefinition struct {
	Name     string `json:"name"`
	Type     string `json:"type"` // string, number, boolean, date
	Required bool   `json:"required"`
	Label    string `json:"label"`
}

type ServiceTypeRepository interface {
	GetAll(ctx context.Context) ([]ServiceType, error)
	GetByID(ctx context.Context, id int64) (*ServiceType, error)
	Create(ctx context.Context, st *ServiceType) error
	Update(ctx context.Context, st *ServiceType) error
	Delete(ctx context.Context, id int64) error
}

type ServiceTypeUsecase interface {
	GetAll(ctx context.Context) ([]ServiceType, error)
	GetByID(ctx context.Context, id int64) (*ServiceType, error)
	Create(ctx context.Context, st *ServiceType) error
	Update(ctx context.Context, id int64, st *ServiceType) error
	Delete(ctx context.Context, id int64) error
}
