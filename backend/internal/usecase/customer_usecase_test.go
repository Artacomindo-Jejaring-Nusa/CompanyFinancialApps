package usecase

import (
	"context"
	"errors"
	"testing"

	"finance-webapps/backend/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockCustomerRepository struct {
	mock.Mock
}

func (m *mockCustomerRepository) GetAll(ctx context.Context, filter domain.CustomerFilter) ([]domain.Customer, int64, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]domain.Customer), args.Get(1).(int64), args.Error(2)
}

func (m *mockCustomerRepository) GetByID(ctx context.Context, id int64) (*domain.Customer, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Customer), args.Error(1)
}

func (m *mockCustomerRepository) GetByCode(ctx context.Context, code string) (*domain.Customer, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Customer), args.Error(1)
}

func (m *mockCustomerRepository) Create(ctx context.Context, customer *domain.Customer) error {
	args := m.Called(ctx, customer)
	return args.Error(0)
}

func (m *mockCustomerRepository) Update(ctx context.Context, customer *domain.Customer) error {
	args := m.Called(ctx, customer)
	return args.Error(0)
}

func (m *mockCustomerRepository) Delete(ctx context.Context, id int64) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// Mock Audit Log Repository
type mockAuditLogRepository struct {
	mock.Mock
}

func (m *mockAuditLogRepository) Create(ctx context.Context, log *domain.AuditLog) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

func (m *mockAuditLogRepository) GetAll(ctx context.Context, entity string, entityID string, page, limit int) ([]domain.AuditLog, int64, error) {
	args := m.Called(ctx, entity, entityID, page, limit)
	return args.Get(0).([]domain.AuditLog), args.Get(1).(int64), args.Error(2)
}

func TestCustomerCreateSuccess(t *testing.T) {
	mockRepo := new(mockCustomerRepository)
	mockAudit := new(mockAuditLogRepository)
	uc := NewCustomerUsecase(mockRepo, mockAudit)

	ctx := context.Background()
	c := &domain.Customer{
		CustomerCode: "CUST-100",
		CustomerName: "Test Customer",
	}

	mockRepo.On("GetByCode", ctx, "CUST-100").Return(nil, nil)
	mockRepo.On("Create", ctx, mock.Anything).Return(nil)
	mockAudit.On("Create", ctx, mock.Anything).Return(nil)

	err := uc.Create(ctx, c)
	assert.NoError(t, err)
	assert.Equal(t, "ACTIVE", c.Status)
	mockRepo.AssertExpectations(t)
}

func TestCustomerCreateDuplicateCode(t *testing.T) {
	mockRepo := new(mockCustomerRepository)
	mockAudit := new(mockAuditLogRepository)
	uc := NewCustomerUsecase(mockRepo, mockAudit)

	ctx := context.Background()
	c := &domain.Customer{
		CustomerCode: "CUST-100",
		CustomerName: "Test Customer",
	}

	mockRepo.On("GetByCode", ctx, "CUST-100").Return(&domain.Customer{ID: 1, CustomerCode: "CUST-100"}, nil)

	err := uc.Create(ctx, c)
	assert.Error(t, err)
	assert.Equal(t, "customer code already exists", err.Error())
	mockRepo.AssertExpectations(t)
}

func TestCustomerGetByIDNotFound(t *testing.T) {
	mockRepo := new(mockCustomerRepository)
	mockAudit := new(mockAuditLogRepository)
	uc := NewCustomerUsecase(mockRepo, mockAudit)

	ctx := context.Background()
	mockRepo.On("GetByID", ctx, int64(99)).Return(nil, errors.New("not found"))

	res, err := uc.GetByID(ctx, int64(99))
	assert.Error(t, err)
	assert.Nil(t, res)
	mockRepo.AssertExpectations(t)
}
