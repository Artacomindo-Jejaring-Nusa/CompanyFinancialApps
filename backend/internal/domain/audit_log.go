package domain

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID        uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    *int64          `json:"user_id"`
	User      *User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Action    string          `json:"action" gorm:"not null"`   // CREATE, UPDATE, DELETE, STATUS_CHANGE, PAYMENT, BULK_PAYMENT, IMPORT
	Entity    string          `json:"entity" gorm:"not null"`   // Service, PaymentSchedule, Customer, Provider, etc.
	EntityID  string          `json:"entity_id" gorm:"not null"`
	OldValue  json.RawMessage `json:"old_value" gorm:"type:jsonb"`
	NewValue  json.RawMessage `json:"new_value" gorm:"type:jsonb"`
	IPAddress string          `json:"ip_address" gorm:"column:ip_address"`
	Timestamp time.Time       `json:"timestamp"`
}

type AuditLogRepository interface {
	Create(ctx context.Context, log *AuditLog) error
	GetAll(ctx context.Context, entity string, entityID string, page, limit int) ([]AuditLog, int64, error)
}
