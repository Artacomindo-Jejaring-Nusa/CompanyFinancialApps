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

type customerUsecase struct {
	customerRepo domain.CustomerRepository
	auditLogRepo domain.AuditLogRepository
}

func NewCustomerUsecase(customerRepo domain.CustomerRepository, auditLogRepo domain.AuditLogRepository) domain.CustomerUsecase {
	return &customerUsecase{customerRepo: customerRepo, auditLogRepo: auditLogRepo}
}

func (u *customerUsecase) GetAll(ctx context.Context, filter domain.CustomerFilter) ([]domain.Customer, int64, error) {
	return u.customerRepo.GetAll(ctx, filter)
}

func (u *customerUsecase) GetByID(ctx context.Context, id int64) (*domain.Customer, error) {
	return u.customerRepo.GetByID(ctx, id)
}

func (u *customerUsecase) Create(ctx context.Context, customer *domain.Customer) error {
	existing, _ := u.customerRepo.GetByCode(ctx, customer.CustomerCode)
	if existing != nil {
		return errors.New("customer code already exists")
	}
	if customer.Status == "" {
		customer.Status = "ACTIVE"
	}
	if err := u.customerRepo.Create(ctx, customer); err != nil {
		return err
	}

	newVal, _ := json.Marshal(customer)
	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "CREATE",
		Entity:    "Customer",
		EntityID:  fmt.Sprintf("%d", customer.ID),
		NewValue:  newVal,
		Timestamp: time.Now(),
	})
	return nil
}

func (u *customerUsecase) Update(ctx context.Context, id int64, customer *domain.Customer) error {
	existing, err := u.customerRepo.GetByID(ctx, id)
	if err != nil {
		return errors.New("customer not found")
	}

	oldVal, _ := json.Marshal(existing)

	existing.CustomerName = customer.CustomerName
	existing.Contact = customer.Contact
	existing.Status = customer.Status
	existing.Notes = customer.Notes

	if err := u.customerRepo.Update(ctx, existing); err != nil {
		return err
	}

	newVal, _ := json.Marshal(existing)
	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "UPDATE",
		Entity:    "Customer",
		EntityID:  fmt.Sprintf("%d", id),
		OldValue:  oldVal,
		NewValue:  newVal,
		Timestamp: time.Now(),
	})
	return nil
}

func (u *customerUsecase) Delete(ctx context.Context, id int64) error {
	if err := u.customerRepo.Delete(ctx, id); err != nil {
		return err
	}

	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "DELETE",
		Entity:    "Customer",
		EntityID:  fmt.Sprintf("%d", id),
		Timestamp: time.Now(),
	})
	return nil
}
