package repository

import (
	"context"
	"time"

	"finance-webapps/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type apiKeyRepository struct {
	db *gorm.DB
}

func NewAPIKeyRepository(db *gorm.DB) domain.APIKeyRepository {
	return &apiKeyRepository{db: db}
}

func (r *apiKeyRepository) GetAll(ctx context.Context) ([]domain.APIKey, error) {
	var keys []domain.APIKey
	err := r.db.WithContext(ctx).Order("created_at DESC").Find(&keys).Error
	return keys, err
}

func (r *apiKeyRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.APIKey, error) {
	var key domain.APIKey
	err := r.db.WithContext(ctx).First(&key, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &key, nil
}

func (r *apiKeyRepository) GetByHash(ctx context.Context, hash string) (*domain.APIKey, error) {
	var key domain.APIKey
	err := r.db.WithContext(ctx).First(&key, "key_hash = ? AND status = 'ACTIVE'", hash).Error
	if err != nil {
		return nil, err
	}
	return &key, nil
}

func (r *apiKeyRepository) Create(ctx context.Context, apiKey *domain.APIKey) error {
	return r.db.WithContext(ctx).Create(apiKey).Error
}

func (r *apiKeyRepository) Revoke(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&domain.APIKey{}).Where("id = ?", id).Update("status", "REVOKED").Error
}

func (r *apiKeyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.APIKey{}, "id = ?", id).Error
}

func (r *apiKeyRepository) UpdateLastUsed(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&domain.APIKey{}).Where("id = ?", id).Update("last_used_at", &now).Error
}
