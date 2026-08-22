package v1

import (
	"net/http"
	"strconv"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

type ServiceTypeHandler struct {
	usecase domain.ServiceTypeUsecase
}

func NewServiceTypeHandler(usecase domain.ServiceTypeUsecase) *ServiceTypeHandler {
	return &ServiceTypeHandler{usecase: usecase}
}

func (h *ServiceTypeHandler) GetAll(c *gin.Context) {
	st, err := h.usecase.GetAll(c.Request.Context())
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to fetch service types", err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Service types retrieved successfully", st, nil)
}

func (h *ServiceTypeHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	st, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil {
		utils.NotFoundResponse(c, "Service type not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Service type retrieved successfully", st, nil)
}

func (h *ServiceTypeHandler) Create(c *gin.Context) {
	var st domain.ServiceType
	if err := c.ShouldBindJSON(&st); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	if err := h.usecase.Create(c.Request.Context(), &st); err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Service type created successfully", st, nil)
}

func (h *ServiceTypeHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	var st domain.ServiceType
	if err := c.ShouldBindJSON(&st); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	if err := h.usecase.Update(c.Request.Context(), id, &st); err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Service type updated successfully", nil, nil)
}

func (h *ServiceTypeHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	if err := h.usecase.Delete(c.Request.Context(), id); err != nil {
		utils.InternalServerErrorResponse(c, "Failed to delete service type", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Service type deleted successfully", nil, nil)
}
