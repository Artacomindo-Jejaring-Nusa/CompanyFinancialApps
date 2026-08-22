package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"finance-webapps/backend/internal/domain"
	"github.com/google/uuid"
)

type providerUsecase struct {
	providerRepo domain.ProviderRepository
	auditLogRepo domain.AuditLogRepository
}

func NewProviderUsecase(providerRepo domain.ProviderRepository, auditLogRepo domain.AuditLogRepository) domain.ProviderUsecase {
	return &providerUsecase{providerRepo: providerRepo, auditLogRepo: auditLogRepo}
}

func (u *providerUsecase) GetAll(ctx context.Context, filter domain.ProviderFilter) ([]domain.Provider, int64, error) {
	return u.providerRepo.GetAll(ctx, filter)
}

func (u *providerUsecase) GetByID(ctx context.Context, id int64) (*domain.Provider, error) {
	return u.providerRepo.GetByID(ctx, id)
}

func (u *providerUsecase) Create(ctx context.Context, provider *domain.Provider) error {
	existing, _ := u.providerRepo.GetByCode(ctx, provider.ProviderCode)
	if existing != nil {
		return errors.New("provider code already exists")
	}
	if provider.Status == "" {
		provider.Status = "ACTIVE"
	}
	if err := u.providerRepo.Create(ctx, provider); err != nil {
		return err
	}

	newVal, _ := json.Marshal(provider)
	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "CREATE",
		Entity:    "Provider",
		EntityID:  fmt.Sprintf("%d", provider.ID),
		NewValue:  newVal,
		Timestamp: time.Now(),
	})
	return nil
}

func (u *providerUsecase) Update(ctx context.Context, id int64, provider *domain.Provider) error {
	existing, err := u.providerRepo.GetByID(ctx, id)
	if err != nil {
		return errors.New("provider not found")
	}

	oldVal, _ := json.Marshal(existing)

	existing.ProviderName = provider.ProviderName
	existing.Contact = provider.Contact
	existing.Email = provider.Email
	existing.Phone = provider.Phone
	existing.Address = provider.Address
	existing.Status = provider.Status

	if err := u.providerRepo.Update(ctx, existing); err != nil {
		return err
	}

	newVal, _ := json.Marshal(existing)
	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "UPDATE",
		Entity:    "Provider",
		EntityID:  fmt.Sprintf("%d", id),
		OldValue:  oldVal,
		NewValue:  newVal,
		Timestamp: time.Now(),
	})
	return nil
}

func (u *providerUsecase) Delete(ctx context.Context, id int64) error {
	if err := u.providerRepo.Delete(ctx, id); err != nil {
		return err
	}

	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "DELETE",
		Entity:    "Provider",
		EntityID:  fmt.Sprintf("%d", id),
		Timestamp: time.Now(),
	})
	return nil
}
