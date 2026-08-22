package v1

import (
	"net/http"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	usecase domain.ReportUsecase
}

func NewReportHandler(usecase domain.ReportUsecase) *ReportHandler {
	return &ReportHandler{usecase: usecase}
}

func (h *ReportHandler) GetMonthlySummary(c *gin.Context) {
	period := c.Query("period")
	report, err := h.usecase.GetMonthlySummary(c.Request.Context(), period)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to generate monthly summary report", err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Monthly summary report generated", report, nil)
}

func (h *ReportHandler) GetProviderSummary(c *gin.Context) {
	reports, err := h.usecase.GetProviderSummary(c.Request.Context())
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to generate provider summary report", err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Provider summary report generated", reports, nil)
}

func (h *ReportHandler) GetOverdueAging(c *gin.Context) {
	aging, err := h.usecase.GetOverdueAging(c.Request.Context())
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to generate overdue aging report", err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Overdue aging report generated", aging, nil)
}
