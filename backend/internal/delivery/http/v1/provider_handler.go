package v1

import (
	"net/http"
	"strconv"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

type ProviderHandler struct {
	usecase domain.ProviderUsecase
}

func NewProviderHandler(usecase domain.ProviderUsecase) *ProviderHandler {
	return &ProviderHandler{usecase: usecase}
}

func (h *ProviderHandler) GetAll(c *gin.Context) {
	param := utils.GetPaginationParam(c)
	filter := domain.ProviderFilter{
		Search: c.Query("search"),
		Status: c.Query("status"),
		Page:   param.Page,
		Limit:  param.Limit,
	}

	providers, total, err := h.usecase.GetAll(c.Request.Context(), filter)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to fetch providers", err.Error())
		return
	}

	meta := utils.CalculateMeta(total, param)
	utils.SuccessResponse(c, http.StatusOK, "Providers retrieved successfully", providers, meta)
}

func (h *ProviderHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	provider, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil {
		utils.NotFoundResponse(c, "Provider not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Provider retrieved successfully", provider, nil)
}

func (h *ProviderHandler) Create(c *gin.Context) {
	var provider domain.Provider
	if err := c.ShouldBindJSON(&provider); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	if err := h.usecase.Create(c.Request.Context(), &provider); err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Provider created successfully", provider, nil)
}

func (h *ProviderHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	var provider domain.Provider
	if err := c.ShouldBindJSON(&provider); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	if err := h.usecase.Update(c.Request.Context(), id, &provider); err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Provider updated successfully", nil, nil)
}

func (h *ProviderHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	if err := h.usecase.Delete(c.Request.Context(), id); err != nil {
		utils.InternalServerErrorResponse(c, "Failed to delete provider", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Provider deleted successfully", nil, nil)
}
