package v1

import (
	"net/http"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

type AuditLogHandler struct {
	repo domain.AuditLogRepository
}

func NewAuditLogHandler(repo domain.AuditLogRepository) *AuditLogHandler {
	return &AuditLogHandler{repo: repo}
}

func (h *AuditLogHandler) GetAll(c *gin.Context) {
	param := utils.GetPaginationParam(c)
	entity := c.Query("entity")
	entityID := c.Query("entity_id")

	logs, total, err := h.repo.GetAll(c.Request.Context(), entity, entityID, param.Page, param.Limit)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to fetch audit logs", err.Error())
		return
	}

	meta := utils.CalculateMeta(total, param)
	utils.SuccessResponse(c, http.StatusOK, "Audit logs retrieved successfully", logs, meta)
}
