package domain

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	ID             uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ServiceTypeID  int64           `json:"service_type_id" gorm:"not null"`
	ServiceType    ServiceType     `json:"service_type" gorm:"foreignKey:ServiceTypeID"`
	CustomerID     int64           `json:"customer_id" gorm:"not null"`
	Customer       Customer        `json:"customer" gorm:"foreignKey:CustomerID"`
	ProviderID     int64           `json:"provider_id" gorm:"not null"`
	Provider       Provider        `json:"provider" gorm:"foreignKey:ProviderID"`
	ServiceName    string          `json:"service_name" gorm:"not null"`
	CID            string          `json:"cid" gorm:"column:cid"`
	SiteID         string          `json:"site_id"`
	SiteName       string          `json:"site_name"`
	Location       string          `json:"location"`
	ContractNumber string          `json:"contract_number"`
	BillingCycle   string          `json:"billing_cycle" gorm:"default:'MONTHLY'"` // MONTHLY, QUARTERLY, YEARLY, CUSTOM
	DueDay         int             `json:"due_day" gorm:"not null"`
	Amount         float64         `json:"amount" gorm:"not null"`
	StartDate      time.Time       `json:"start_date" gorm:"not null"`
	EndDate        *time.Time      `json:"end_date"`
	PIC            string          `json:"pic" gorm:"column:pic"`
	Status         string          `json:"status" gorm:"default:'ACTIVE'"` // ACTIVE, SUSPENDED, CANCELLED, EXPIRED
	Notes          string          `json:"notes"`
	Attributes     json.RawMessage `json:"attributes" gorm:"type:jsonb;default:'{}'"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type ServiceFilter struct {
	Search        string
	ServiceTypeID int64
	CustomerID    int64
	ProviderID    int64
	Status        string
	BillingCycle  string
	Page          int
	Limit         int
}

type ServiceRepository interface {
	GetAll(ctx context.Context, filter ServiceFilter) ([]Service, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Service, error)
	Create(ctx context.Context, service *Service) error
	Update(ctx context.Context, service *Service) error
	Archive(ctx context.Context, id uuid.UUID) error
}

type ServiceUsecase interface {
	GetAll(ctx context.Context, filter ServiceFilter) ([]Service, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Service, error)
	Create(ctx context.Context, service *Service) error
	Update(ctx context.Context, id uuid.UUID, service *Service) error
	Archive(ctx context.Context, id uuid.UUID) error
}
