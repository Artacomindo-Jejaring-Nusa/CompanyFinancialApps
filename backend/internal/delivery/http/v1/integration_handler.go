package v1

import (
	"net/http"
	"strconv"
	"time"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type IntegrationHandler struct {
	db                  *gorm.DB
	paymentScheduleRepo domain.PaymentScheduleRepository
}

func NewIntegrationHandler(db *gorm.DB, paymentScheduleRepo domain.PaymentScheduleRepository) *IntegrationHandler {
	return &IntegrationHandler{
		db:                  db,
		paymentScheduleRepo: paymentScheduleRepo,
	}
}

// Health check and token verification for SaaS HRMS
func (h *IntegrationHandler) GetHealth(c *gin.Context) {
	apiKeyName, _ := c.Get("apiKeyName")
	scopes, _ := c.Get("scopes")

	utils.SuccessResponse(c, http.StatusOK, "Integration API connection verified successfully", gin.H{
		"status":      "OPERATIONAL",
		"version":     "v1",
		"service":     "FSPMS Payment & Financial Integration API",
		"server_time": time.Now().Format(time.RFC3339),
		"client": gin.H{
			"app_name": apiKeyName,
			"scopes":   scopes,
		},
	}, nil)
}

// Aggregated Payment Reports specifically designed for SaaS HRMS synchronization
func (h *IntegrationHandler) GetPaymentReports(c *gin.Context) {
	ctx := c.Request.Context()

	period := c.Query("period")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	type SummaryStat struct {
		TotalSchedules int64   `json:"total_schedules"`
		TotalAmount    float64 `json:"total_amount"`
		PaidAmount     float64 `json:"paid_amount"`
		RemainingDue   float64 `json:"remaining_due"`
		PaidCount      int64   `json:"paid_count"`
		UpcomingCount  int64   `json:"upcoming_count"`
		OverdueCount   int64   `json:"overdue_count"`
	}

	var stat SummaryStat

	query := h.db.WithContext(ctx).Model(&domain.PaymentSchedule{})
	if period != "" {
		query = query.Where("period = ?", period)
	}
	if startDate != "" {
		query = query.Where("due_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("due_date <= ?", endDate)
	}

	query.Select(`
		COUNT(*) as total_schedules,
		COALESCE(SUM(amount), 0) as total_amount,
		COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE amount - remaining_amount END), 0) as paid_amount,
		COALESCE(SUM(CASE WHEN status != 'PAID' THEN remaining_amount ELSE 0 END), 0) as remaining_due,
		COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count,
		COUNT(CASE WHEN status = 'UPCOMING' OR status = 'DUE_SOON' OR status = 'DUE_TODAY' THEN 1 END) as upcoming_count,
		COUNT(CASE WHEN status = 'OVERDUE' THEN 1 END) as overdue_count
	`).Scan(&stat)

	// Vendor breakdown
	type VendorStat struct {
		ProviderID   int64   `json:"provider_id"`
		ProviderName string  `json:"provider_name"`
		TotalBills   int64   `json:"total_bills"`
		TotalAmount  float64 `json:"total_amount"`
		PaidAmount   float64 `json:"paid_amount"`
		PendingDue   float64 `json:"pending_due"`
	}

	var vendorStats []VendorStat
	vQuery := h.db.WithContext(ctx).Table("payment_schedules").
		Joins("JOIN services ON services.id = payment_schedules.service_id").
		Joins("JOIN providers ON providers.id = services.provider_id")

	if period != "" {
		vQuery = vQuery.Where("payment_schedules.period = ?", period)
	}
	if startDate != "" {
		vQuery = vQuery.Where("payment_schedules.due_date >= ?", startDate)
	}
	if endDate != "" {
		vQuery = vQuery.Where("payment_schedules.due_date <= ?", endDate)
	}

	vQuery.Select(`
		providers.id as provider_id,
		providers.provider_name as provider_name,
		COUNT(payment_schedules.id) as total_bills,
		COALESCE(SUM(payment_schedules.amount), 0) as total_amount,
		COALESCE(SUM(CASE WHEN payment_schedules.status = 'PAID' THEN payment_schedules.amount ELSE payment_schedules.amount - payment_schedules.remaining_amount END), 0) as paid_amount,
		COALESCE(SUM(CASE WHEN payment_schedules.status != 'PAID' THEN payment_schedules.remaining_amount ELSE 0 END), 0) as pending_due
	`).Group("providers.id, providers.provider_name").Order("total_amount DESC").Scan(&vendorStats)

	utils.SuccessResponse(c, http.StatusOK, "Payment reports retrieved successfully for SaaS HRMS", gin.H{
		"period_filter":    period,
		"summary":          stat,
		"vendor_breakdown": vendorStats,
		"synced_at":        time.Now().Format(time.RFC3339),
	}, nil)
}

// Detailed payment schedules for SaaS HRMS
func (h *IntegrationHandler) GetPaymentsList(c *gin.Context) {
	ctx := c.Request.Context()

	status := c.Query("status")
	period := c.Query("period")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 500 {
		limit = 50
	}

	filter := domain.PaymentScheduleFilter{
		Status: status,
		Search: search,
		Page:   page,
		Limit:  limit,
	}

	if period != "" {
		// Custom filter handled in repo
	}

	schedules, total, err := h.paymentScheduleRepo.GetAll(ctx, filter)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to retrieve payments", err.Error())
		return
	}

	type PaymentDTO struct {
		ID              string   `json:"schedule_id"`
		Period          string   `json:"period"`
		ServiceName     string   `json:"service_name"`
		CircuitID       string   `json:"circuit_id"`
		ContractNumber  string   `json:"contract_number"`
		ProviderName    string   `json:"provider_name"`
		CustomerName    string   `json:"customer_name"`
		DueDate         string   `json:"due_date"`
		Amount          float64  `json:"amount"`
		RemainingAmount float64  `json:"remaining_amount"`
		Status          string   `json:"status"`
		PaymentDate     *string  `json:"payment_date,omitempty"`
		Notes           string   `json:"notes"`
	}

	var dtoList []PaymentDTO
	for _, s := range schedules {
		var pDate *string
		if s.PaymentDate != nil {
			str := s.PaymentDate.Format("2006-01-02")
			pDate = &str
		}

		dtoList = append(dtoList, PaymentDTO{
			ID:              s.ID.String(),
			Period:          s.Period,
			ServiceName:     s.Service.ServiceName,
			CircuitID:       s.Service.CID,
			ContractNumber:  s.Service.ContractNumber,
			ProviderName:    s.Service.Provider.ProviderName,
			CustomerName:    s.Service.Customer.CustomerName,
			DueDate:         s.DueDate.Format("2006-01-02"),
			Amount:          s.Amount,
			RemainingAmount: s.RemainingAmount,
			Status:          s.Status,
			PaymentDate:     pDate,
			Notes:           s.Notes,
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "Payments list retrieved successfully", dtoList, gin.H{
		"page":        page,
		"limit":       limit,
		"total_items": total,
		"total_pages": (total + int64(limit) - 1) / int64(limit),
	})
}
