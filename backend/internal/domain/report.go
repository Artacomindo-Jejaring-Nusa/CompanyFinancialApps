package domain

import (
	"context"
)

type MonthlySummaryReport struct {
	Period          string  `json:"period"`
	TotalSchedules  int64   `json:"total_schedules"`
	TotalAmount     float64 `json:"total_amount"`
	PaidAmount      float64 `json:"paid_amount"`
	RemainingAmount float64 `json:"remaining_amount"`
}

type ProviderSummaryReport struct {
	ProviderID    int64   `json:"provider_id"`
	ProviderName  string  `json:"provider_name"`
	TotalServices int64   `json:"total_services"`
	TotalAmount   float64 `json:"total_amount"`
	PaidAmount    float64 `json:"paid_amount"`
}

type OverdueAgingBucket struct {
	BucketName string  `json:"bucket_name"` // 0-7 days, 8-30 days, 31-60 days, >60 days
	Count      int64   `json:"count"`
	TotalAmount float64 `json:"total_amount"`
}

type ReportUsecase interface {
	GetMonthlySummary(ctx context.Context, period string) (*MonthlySummaryReport, error)
	GetProviderSummary(ctx context.Context) ([]ProviderSummaryReport, error)
	GetOverdueAging(ctx context.Context) ([]OverdueAgingBucket, error)
}
