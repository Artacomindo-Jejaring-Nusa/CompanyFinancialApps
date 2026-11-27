package usecase

import (
	"context"
	"testing"
	"time"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockPaymentScheduleRepo struct {
	mock.Mock
}

func (m *mockPaymentScheduleRepo) GetAll(ctx context.Context, filter domain.PaymentScheduleFilter) ([]domain.PaymentSchedule, int64, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]domain.PaymentSchedule), args.Get(1).(int64), args.Error(2)
}

func (m *mockPaymentScheduleRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.PaymentSchedule, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.PaymentSchedule), args.Error(1)
}

func (m *mockPaymentScheduleRepo) GetByServiceAndPeriod(ctx context.Context, serviceID uuid.UUID, period string) (*domain.PaymentSchedule, error) {
	args := m.Called(ctx, serviceID, period)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.PaymentSchedule), args.Error(1)
}

func (m *mockPaymentScheduleRepo) Create(ctx context.Context, schedule *domain.PaymentSchedule) error {
	args := m.Called(ctx, schedule)
	return args.Error(0)
}

func (m *mockPaymentScheduleRepo) Update(ctx context.Context, schedule *domain.PaymentSchedule) error {
	args := m.Called(ctx, schedule)
	return args.Error(0)
}

func (m *mockPaymentScheduleRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *mockPaymentScheduleRepo) BatchCreate(ctx context.Context, schedules []domain.PaymentSchedule) error {
	args := m.Called(ctx, schedules)
	return args.Error(0)
}

func (m *mockPaymentScheduleRepo) UpdateUnpaidAmountByServiceID(ctx context.Context, serviceID uuid.UUID, newAmount float64) error {
	args := m.Called(ctx, serviceID, newAmount)
	return args.Error(0)
}

type mockPaymentHistoryRepo struct {
	mock.Mock
}

func (m *mockPaymentHistoryRepo) Create(ctx context.Context, history *domain.PaymentHistory) error {
	args := m.Called(ctx, history)
	return args.Error(0)
}

func (m *mockPaymentHistoryRepo) GetByScheduleID(ctx context.Context, scheduleID uuid.UUID) ([]domain.PaymentHistory, error) {
	args := m.Called(ctx, scheduleID)
	return args.Get(0).([]domain.PaymentHistory), args.Error(1)
}

func TestMarkAsPaid_FullSettlementWithAdjustedAmount(t *testing.T) {
	psRepo := new(mockPaymentScheduleRepo)
	phRepo := new(mockPaymentHistoryRepo)
	auditRepo := new(mockAuditLogRepository)

	uc := NewPaymentScheduleUsecase(psRepo, phRepo, auditRepo)

	scheduleID := uuid.New()
	serviceID := uuid.New()
	existingSchedule := &domain.PaymentSchedule{
		ID:              scheduleID,
		ServiceID:       serviceID,
		Period:          "2026-10",
		DueDate:         time.Now().AddDate(0, 0, 5),
		Amount:          255300,
		RemainingAmount: 255300,
		Status:          "UPCOMING",
		Service: domain.Service{
			ID:           serviceID,
			BillingCycle: "ONE_TIME",
		},
	}

	psRepo.On("GetByID", mock.Anything, scheduleID).Return(existingSchedule, nil)
	psRepo.On("Update", mock.Anything, mock.MatchedBy(func(s *domain.PaymentSchedule) bool {
		return s.Status == "PAID" && s.RemainingAmount == 0 && s.Amount == 219000
	})).Return(nil)
	phRepo.On("Create", mock.Anything, mock.Anything).Return(nil)
	auditRepo.On("Create", mock.Anything, mock.Anything).Return(nil)

	isFull := true
	req := domain.MarkAsPaidRequest{
		ScheduleID:       scheduleID,
		PaymentDate:      time.Now().Format("2006-01-02"),
		PaymentAmount:    219000, // Adjusted amount lower than 255300
		PaymentReference: "TRX-TEST-001",
		PaymentMethod:    "Bank Transfer (BCA)",
		Notes:            "Full payment adjusted without PPN",
		IsFullSettlement: &isFull,
	}

	res, err := uc.MarkAsPaid(context.Background(), req, 1)

	assert.NoError(t, err)
	assert.NotNil(t, res)
	assert.Equal(t, "PAID", res.Status)
	assert.Equal(t, float64(0), res.RemainingAmount)
	assert.Equal(t, float64(219000), res.Amount)
	psRepo.AssertExpectations(t)
}

func TestCalculateScheduleStatus_GuardsPartiallyPaid(t *testing.T) {
	schedule := &domain.PaymentSchedule{
		DueDate: time.Now().AddDate(0, 0, -5), // 5 days past due
		Status:  "PARTIALLY_PAID",
	}

	repository.CalculateScheduleStatus(schedule, time.Now())

	// Status should remain PARTIALLY_PAID and NOT be overwritten to OVERDUE
	assert.Equal(t, "PARTIALLY_PAID", schedule.Status)
}
