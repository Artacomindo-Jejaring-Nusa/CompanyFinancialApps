package usecase

import (
	"context"
	"time"

	"finance-webapps/backend/internal/domain"
	"gorm.io/gorm"
)

type reportUsecase struct {
	db *gorm.DB
}

func NewReportUsecase(db *gorm.DB) domain.ReportUsecase {
	return &reportUsecase{db: db}
}

func (u *reportUsecase) GetMonthlySummary(ctx context.Context, period string) (*domain.MonthlySummaryReport, error) {
	if period == "" {
		period = time.Now().Format("2006-01")
	}

	report := &domain.MonthlySummaryReport{Period: period}

	type Stats struct {
		TotalSchedules  int64   `gorm:"column:total_schedules"`
		TotalAmount     float64 `gorm:"column:total_amount"`
		PaidAmount      float64 `gorm:"column:paid_amount"`
		RemainingAmount float64 `gorm:"column:remaining_amount"`
	}

	var stats Stats
	err := u.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
		Select("COUNT(*) as total_schedules, COALESCE(SUM(amount), 0) as total_amount, COALESCE(SUM(amount - remaining_amount), 0) as paid_amount, COALESCE(SUM(remaining_amount), 0) as remaining_amount").
		Where("period = ?", period).
		Scan(&stats).Error

	if err != nil {
		return nil, err
	}

	report.TotalSchedules = stats.TotalSchedules
	report.TotalAmount = stats.TotalAmount
	report.PaidAmount = stats.PaidAmount
	report.RemainingAmount = stats.RemainingAmount

	return report, nil
}

func (u *reportUsecase) GetProviderSummary(ctx context.Context) ([]domain.ProviderSummaryReport, error) {
	var reports []domain.ProviderSummaryReport

	err := u.db.WithContext(ctx).Table("providers").
		Select("providers.id as provider_id, providers.provider_name as provider_name, COUNT(DISTINCT services.id) as total_services, COALESCE(SUM(payment_schedules.amount), 0) as total_amount, COALESCE(SUM(payment_schedules.amount - payment_schedules.remaining_amount), 0) as paid_amount").
		Joins("LEFT JOIN services ON services.provider_id = providers.id").
		Joins("LEFT JOIN payment_schedules ON payment_schedules.service_id = services.id").
		Group("providers.id, providers.provider_name").
		Order("providers.id ASC").
		Scan(&reports).Error

	return reports, err
}

func (u *reportUsecase) GetOverdueAging(ctx context.Context) ([]domain.OverdueAgingBucket, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	type AgingQuery struct {
		Count       int64   `gorm:"column:count"`
		TotalAmount float64 `gorm:"column:total_amount"`
	}

	buckets := []struct {
		Name     string
		StartDays int
		EndDays   int
	}{
		{"0–7 hari", 0, 7},
		{"8–30 hari", 8, 30},
		{"31–60 hari", 31, 60},
		{"> 60 hari", 61, 99999},
	}

	var result []domain.OverdueAgingBucket

	for _, b := range buckets {
		startDate := today.AddDate(0, 0, -b.EndDays)
		endDate := today.AddDate(0, 0, -b.StartDays)

		var res AgingQuery
		query := u.db.WithContext(ctx).Model(&domain.PaymentSchedule{}).
			Select("COUNT(*) as count, COALESCE(SUM(remaining_amount), 0) as total_amount").
			Where("status NOT IN ('PAID', 'CANCELLED')")

		if b.EndDays == 99999 {
			query = query.Where("due_date < ?", endDate)
		} else {
			query = query.Where("due_date >= ? AND due_date <= ?", startDate, endDate)
		}

		_ = query.Scan(&res)

		result = append(result, domain.OverdueAgingBucket{
			BucketName: b.Name,
			Count:      res.Count,
			TotalAmount: res.TotalAmount,
		})
	}

	return result, nil
}
