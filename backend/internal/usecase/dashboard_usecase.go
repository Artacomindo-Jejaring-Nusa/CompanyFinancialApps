package usecase

import (
	"context"
	"time"

	"finance-webapps/backend/internal/domain"
	"gorm.io/gorm"
)

type dashboardUsecase struct {
	db *gorm.DB
}

func NewDashboardUsecase(db *gorm.DB) domain.DashboardUsecase {
	return &dashboardUsecase{db: db}
}

func (u *dashboardUsecase) GetSummary(ctx context.Context) (*domain.DashboardSummary, error) {
	summary := &domain.DashboardSummary{}
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	sevenDaysLater := today.AddDate(0, 0, 7)
	thisMonthPeriod := now.Format("2006-01")

	// 1. Active Services Count
	_ = u.db.WithContext(ctx).Model(&domain.Service{}).Where("status = ?", "ACTIVE").Count(&summary.ActiveServicesCount)

	// 2. Due Today Count & Amount
	type CountAmount struct {
		Count  int64   `gorm:"column:count"`
		Amount float64 `gorm:"column:amount"`
	}

	var dueToday CountAmount
	_ = u.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
		Select("COUNT(*) as count, COALESCE(SUM(remaining_amount), 0) as amount").
		Where("due_date = ? AND status NOT IN ('PAID', 'CANCELLED')", today).
		Scan(&dueToday)
	summary.DueTodayCount = dueToday.Count
	summary.DueTodayAmount = dueToday.Amount

	// 3. Due Next 7 Days Count & Amount
	var dueNext7 CountAmount
	_ = u.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
		Select("COUNT(*) as count, COALESCE(SUM(remaining_amount), 0) as amount").
		Where("due_date >= ? AND due_date <= ? AND status NOT IN ('PAID', 'CANCELLED')", today, sevenDaysLater).
		Scan(&dueNext7)
	summary.DueNext7DaysCount = dueNext7.Count
	summary.DueNext7DaysAmount = dueNext7.Amount

	// 4. Overdue Count & Amount
	var overdue CountAmount
	_ = u.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
		Select("COUNT(*) as count, COALESCE(SUM(remaining_amount), 0) as amount").
		Where("(due_date < ? AND status NOT IN ('PAID', 'CANCELLED')) OR status = 'OVERDUE'", today).
		Scan(&overdue)
	summary.OverdueCount = overdue.Count
	summary.OverdueAmount = overdue.Amount

	// 5. Total This Month Amount
	_ = u.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("period = ?", thisMonthPeriod).
		Scan(&summary.TotalThisMonthAmount)

	// 6. Upcoming Payment Count
	_ = u.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
		Where("status = ?", "UPCOMING").
		Count(&summary.UpcomingPaymentCount)

	// 7. Upcoming Schedules List (Top 5)
	_ = u.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
		Preload("Service").Preload("Service.Customer").Preload("Service.Provider").
		Where("due_date >= ? AND status NOT IN ('PAID', 'CANCELLED')", today).
		Order("due_date ASC").Limit(5).Find(&summary.UpcomingSchedules)

	// 8. Overdue Schedules List (Top 5)
	_ = u.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
		Preload("Service").Preload("Service.Customer").Preload("Service.Provider").
		Where("due_date < ? AND status NOT IN ('PAID', 'CANCELLED')", today).
		Order("due_date ASC").Limit(5).Find(&summary.OverdueSchedules)

	return summary, nil
}
