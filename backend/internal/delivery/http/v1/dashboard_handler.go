package v1

import (
	"net/http"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	usecase domain.DashboardUsecase
}

func NewDashboardHandler(usecase domain.DashboardUsecase) *DashboardHandler {
	return &DashboardHandler{usecase: usecase}
}

func (h *DashboardHandler) GetSummary(c *gin.Context) {
	summary, err := h.usecase.GetSummary(c.Request.Context())
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to fetch dashboard summary", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Dashboard summary retrieved successfully", summary, nil)
}
