package v1

import (
	"net/http"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type APIKeyHandler struct {
	usecase domain.APIKeyUsecase
}

func NewAPIKeyHandler(usecase domain.APIKeyUsecase) *APIKeyHandler {
	return &APIKeyHandler{usecase: usecase}
}

func (h *APIKeyHandler) GetAll(c *gin.Context) {
	keys, err := h.usecase.GetAll(c.Request.Context())
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to retrieve API keys", err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "API keys retrieved successfully", keys, nil)
}

func (h *APIKeyHandler) Create(c *gin.Context) {
	var req domain.CreateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request payload", err.Error())
		return
	}

	createdBy := "admin"
	if username, exists := c.Get("username"); exists {
		if uStr, ok := username.(string); ok && uStr != "" {
			createdBy = uStr
		}
	}

	apiKey, err := h.usecase.Generate(c.Request.Context(), req, createdBy)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to generate API key", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "API key generated successfully. Please copy it now as it will not be shown again.", apiKey, nil)
}

func (h *APIKeyHandler) Revoke(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid API key UUID format", err.Error())
		return
	}

	if err := h.usecase.Revoke(c.Request.Context(), id); err != nil {
		utils.InternalServerErrorResponse(c, "Failed to revoke API key", err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "API key revoked successfully", nil, nil)
}

func (h *APIKeyHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid API key UUID format", err.Error())
		return
	}

	if err := h.usecase.Delete(c.Request.Context(), id); err != nil {
		utils.InternalServerErrorResponse(c, "Failed to delete API key", err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "API key deleted successfully", nil, nil)
}
