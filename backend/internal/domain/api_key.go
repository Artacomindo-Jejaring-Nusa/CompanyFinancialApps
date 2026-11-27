package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type APIKey struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name       string     `json:"name" gorm:"type:varchar(255);not null"`
	KeyPrefix  string     `json:"key_prefix" gorm:"type:varchar(32);not null;index"`
	KeyHash    string     `json:"-" gorm:"type:varchar(255);not null;uniqueIndex"`
	Scopes     string     `json:"scopes" gorm:"type:text;default:'read:payment_reports,read:payments'"`
	Status     string     `json:"status" gorm:"type:varchar(50);default:'ACTIVE'"`
	CreatedBy  string     `json:"created_by" gorm:"type:varchar(100);default:'admin'"`
	LastUsedAt *time.Time `json:"last_used_at"`
	ExpiresAt  *time.Time `json:"expires_at"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`

	// PlainKey is populated only upon initial generation so user can copy it once
	PlainKey string `json:"plain_key,omitempty" gorm:"-"`
}

type CreateAPIKeyRequest struct {
	Name      string `json:"name" binding:"required"`
	Scopes    string `json:"scopes"`
	ExpiresIn string `json:"expires_in"` // "30d", "90d", "365d", "never"
}

type APIKeyRepository interface {
	GetAll(ctx context.Context) ([]APIKey, error)
	GetByID(ctx context.Context, id uuid.UUID) (*APIKey, error)
	GetByHash(ctx context.Context, hash string) (*APIKey, error)
	Create(ctx context.Context, apiKey *APIKey) error
	Revoke(ctx context.Context, id uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateLastUsed(ctx context.Context, id uuid.UUID) error
}

type APIKeyUsecase interface {
	GetAll(ctx context.Context) ([]APIKey, error)
	Generate(ctx context.Context, req CreateAPIKeyRequest, createdBy string) (*APIKey, error)
	Revoke(ctx context.Context, id uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID) error
	ValidateKey(ctx context.Context, rawKey string) (*APIKey, error)
}
