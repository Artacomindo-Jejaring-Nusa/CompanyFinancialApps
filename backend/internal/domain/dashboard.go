package domain

import (
	"context"
)

type DashboardSummary struct {
	ActiveServicesCount  int64            `json:"active_services_count"`
	DueTodayCount        int64            `json:"due_today_count"`
	DueTodayAmount       float64          `json:"due_today_amount"`
	DueNext7DaysCount    int64            `json:"due_next_7_days_count"`
	DueNext7DaysAmount   float64          `json:"due_next_7_days_amount"`
	OverdueCount         int64            `json:"overdue_count"`
	OverdueAmount        float64          `json:"overdue_amount"`
	TotalThisMonthAmount float64          `json:"total_this_month_amount"`
	UpcomingPaymentCount int64            `json:"upcoming_payment_count"`
	UpcomingSchedules    []PaymentSchedule `json:"upcoming_schedules"`
	OverdueSchedules     []PaymentSchedule `json:"overdue_schedules"`
}

type DashboardUsecase interface {
	GetSummary(ctx context.Context) (*DashboardSummary, error)
}
