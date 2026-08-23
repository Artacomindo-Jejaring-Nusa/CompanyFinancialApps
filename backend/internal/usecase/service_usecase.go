package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"finance-webapps/backend/internal/domain"
	"github.com/google/uuid"
)

type serviceUsecase struct {
	serviceRepo         domain.ServiceRepository
	paymentScheduleRepo domain.PaymentScheduleRepository
	auditLogRepo        domain.AuditLogRepository
}

func NewServiceUsecase(
	serviceRepo domain.ServiceRepository,
	paymentScheduleRepo domain.PaymentScheduleRepository,
	auditLogRepo domain.AuditLogRepository,
) domain.ServiceUsecase {
	return &serviceUsecase{
		serviceRepo:         serviceRepo,
		paymentScheduleRepo: paymentScheduleRepo,
		auditLogRepo:        auditLogRepo,
	}
}

func (u *serviceUsecase) GetAll(ctx context.Context, filter domain.ServiceFilter) ([]domain.Service, int64, error) {
	return u.serviceRepo.GetAll(ctx, filter)
}

func (u *serviceUsecase) GetByID(ctx context.Context, id uuid.UUID) (*domain.Service, error) {
	return u.serviceRepo.GetByID(ctx, id)
}

func (u *serviceUsecase) Create(ctx context.Context, service *domain.Service) error {
	if service.Status == "" {
		service.Status = "ACTIVE"
	}
	if service.BillingCycle == "" {
		service.BillingCycle = "MONTHLY"
	}

	if err := u.serviceRepo.Create(ctx, service); err != nil {
		return err
	}

	// Audit Log
	newVal, _ := json.Marshal(service)
	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "CREATE",
		Entity:    "Service",
		EntityID:  service.ID.String(),
		NewValue:  newVal,
		Timestamp: time.Now(),
	})

	// Auto-generate initial Payment Schedule(s) for this service
	return u.generateInitialSchedules(ctx, service)
}

func (u *serviceUsecase) Update(ctx context.Context, id uuid.UUID, service *domain.Service) error {
	existing, err := u.serviceRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	oldVal, _ := json.Marshal(existing)

	existing.ServiceName = service.ServiceName
	existing.CID = service.CID
	existing.SiteID = service.SiteID
	existing.SiteName = service.SiteName
	existing.Location = service.Location
	existing.ContractNumber = service.ContractNumber
	existing.BillingCycle = service.BillingCycle
	existing.DueDay = service.DueDay
	existing.Amount = service.Amount
	existing.PIC = service.PIC
	existing.Status = service.Status
	existing.Notes = service.Notes
	existing.Attributes = service.Attributes

	if err := u.serviceRepo.Update(ctx, existing); err != nil {
		return err
	}

	newVal, _ := json.Marshal(existing)
	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "UPDATE",
		Entity:    "Service",
		EntityID:  id.String(),
		OldValue:  oldVal,
		NewValue:  newVal,
		Timestamp: time.Now(),
	})

	return nil
}

func (u *serviceUsecase) Archive(ctx context.Context, id uuid.UUID) error {
	if err := u.serviceRepo.Archive(ctx, id); err != nil {
		return err
	}

	_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
		ID:        uuid.New(),
		Action:    "ARCHIVE",
		Entity:    "Service",
		EntityID:  id.String(),
		Timestamp: time.Now(),
	})

	return nil
}

func (u *serviceUsecase) generateInitialSchedules(ctx context.Context, service *domain.Service) error {
	now := time.Now()
	var schedules []domain.PaymentSchedule

	var dueDate time.Time
	var periodStr string

	if !service.StartDate.IsZero() {
		dueDate = service.StartDate
		periodStr = service.StartDate.Format("2006-01")
	} else {
		targetMonth := now
		periodStr = targetMonth.Format("2006-01")

		year := targetMonth.Year()
		month := targetMonth.Month()

		lastDayOfMonth := time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()
		actualDueDay := service.DueDay
		if actualDueDay <= 0 {
			actualDueDay = 25
		}
		if actualDueDay > lastDayOfMonth {
			actualDueDay = lastDayOfMonth
		}

		dueDate = time.Date(year, month, actualDueDay, 0, 0, 0, 0, time.Local)
	}

	status := "UPCOMING"
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	dueDayOnly := time.Date(dueDate.Year(), dueDate.Month(), dueDate.Day(), 0, 0, 0, 0, now.Location())
	if dueDayOnly.Before(today) {
		status = "OVERDUE"
	} else if dueDayOnly.Equal(today) {
		status = "DUE"
	}

	schedule := domain.PaymentSchedule{
		ID:              uuid.New(),
		ServiceID:       service.ID,
		Period:          periodStr,
		DueDate:         dueDate,
		Amount:          service.Amount,
		RemainingAmount: service.Amount,
		Status:          status,
		Notes:           fmt.Sprintf("Schedule for period %s (%s)", periodStr, service.BillingCycle),
	}

	schedules = append(schedules, schedule)
	return u.paymentScheduleRepo.BatchCreate(ctx, schedules)
}
