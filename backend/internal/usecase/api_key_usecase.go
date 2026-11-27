package usecase

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"finance-webapps/backend/internal/domain"
	"github.com/google/uuid"
)

type apiKeyUsecase struct {
	repo         domain.APIKeyRepository
	auditLogRepo domain.AuditLogRepository
}

func NewAPIKeyUsecase(repo domain.APIKeyRepository, auditLogRepo domain.AuditLogRepository) domain.APIKeyUsecase {
	return &apiKeyUsecase{
		repo:         repo,
		auditLogRepo: auditLogRepo,
	}
}

func (u *apiKeyUsecase) GetAll(ctx context.Context) ([]domain.APIKey, error) {
	return u.repo.GetAll(ctx)
}

func (u *apiKeyUsecase) Generate(ctx context.Context, req domain.CreateAPIKeyRequest, createdBy string) (*domain.APIKey, error) {
	// Generate 24 random bytes
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return nil, fmt.Errorf("failed to generate random token: %w", err)
	}
	randomToken := hex.EncodeToString(b)
	plainKey := fmt.Sprintf("fspms_live_%s", randomToken)

	// Key Prefix (e.g. "fspms_live_4a9f8e...")
	keyPrefix := plainKey[:18]

	// Compute SHA-256 hash
	hash := sha256.Sum256([]byte(plainKey))
	keyHash := hex.EncodeToString(hash[:])

	// Calculate expiration
	var expiresAt *time.Time
	now := time.Now()
	switch req.ExpiresIn {
	case "30d":
		t := now.AddDate(0, 0, 30)
		expiresAt = &t
	case "90d":
		t := now.AddDate(0, 0, 90)
		expiresAt = &t
	case "365d", "1y":
		t := now.AddDate(1, 0, 0)
		expiresAt = &t
	case "never", "":
		expiresAt = nil
	default:
		expiresAt = nil
	}

	scopes := req.Scopes
	if scopes == "" {
		scopes = "read:payment_reports,read:payments"
	}

	apiKey := &domain.APIKey{
		ID:        uuid.New(),
		Name:      req.Name,
		KeyPrefix: keyPrefix,
		KeyHash:   keyHash,
		Scopes:    scopes,
		Status:    "ACTIVE",
		CreatedBy: createdBy,
		ExpiresAt: expiresAt,
		CreatedAt: now,
		UpdatedAt: now,
		PlainKey:  plainKey, // Returned once to user
	}

	if err := u.repo.Create(ctx, apiKey); err != nil {
		return nil, err
	}

	// Audit Log
	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "CREATE_API_KEY",
		Entity:    "APIKey",
		EntityID:  apiKey.ID.String(),
		Timestamp: time.Now(),
	})

	return apiKey, nil
}

func (u *apiKeyUsecase) Revoke(ctx context.Context, id uuid.UUID) error {
	err := u.repo.Revoke(ctx, id)
	if err == nil {
		_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
			ID:        uuid.New(),
			Action:    "REVOKE_API_KEY",
			Entity:    "APIKey",
			EntityID:  id.String(),
			Timestamp: time.Now(),
		})
	}
	return err
}

func (u *apiKeyUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	err := u.repo.Delete(ctx, id)
	if err == nil {
		_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
			ID:        uuid.New(),
			Action:    "DELETE_API_KEY",
			Entity:    "APIKey",
			EntityID:  id.String(),
			Timestamp: time.Now(),
		})
	}
	return err
}

func (u *apiKeyUsecase) ValidateKey(ctx context.Context, rawKey string) (*domain.APIKey, error) {
	if rawKey == "" {
		return nil, errors.New("empty api key")
	}

	hash := sha256.Sum256([]byte(rawKey))
	keyHash := hex.EncodeToString(hash[:])

	apiKey, err := u.repo.GetByHash(ctx, keyHash)
	if err != nil {
		return nil, errors.New("invalid or revoked api key")
	}

	if apiKey.Status != "ACTIVE" {
		return nil, errors.New("api key is not active")
	}

	if apiKey.ExpiresAt != nil && apiKey.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("api key has expired")
	}

	// Async update last used
	go func(id uuid.UUID) {
		_ = u.repo.UpdateLastUsed(context.Background(), id)
	}(apiKey.ID)

	return apiKey, nil
}
