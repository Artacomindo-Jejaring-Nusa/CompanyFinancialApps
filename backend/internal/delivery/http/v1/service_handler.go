package v1

import (
	"net/http"
	"strconv"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ServiceHandler struct {
	usecase domain.ServiceUsecase
}

func NewServiceHandler(usecase domain.ServiceUsecase) *ServiceHandler {
	return &ServiceHandler{usecase: usecase}
}

func (h *ServiceHandler) GetAll(c *gin.Context) {
	param := utils.GetPaginationParam(c)

	stID, _ := strconv.ParseInt(c.Query("service_type_id"), 10, 64)
	cID, _ := strconv.ParseInt(c.Query("customer_id"), 10, 64)
	pID, _ := strconv.ParseInt(c.Query("provider_id"), 10, 64)

	filter := domain.ServiceFilter{
		Search:        c.Query("search"),
		ServiceTypeID: stID,
		CustomerID:    cID,
		ProviderID:    pID,
		Status:        c.Query("status"),
		BillingCycle:  c.Query("billing_cycle"),
		Page:          param.Page,
		Limit:         param.Limit,
	}

	services, total, err := h.usecase.GetAll(c.Request.Context(), filter)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to fetch services", err.Error())
		return
	}

	meta := utils.CalculateMeta(total, param)
	utils.SuccessResponse(c, http.StatusOK, "Services retrieved successfully", services, meta)
}

func (h *ServiceHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequestResponse(c, "Invalid UUID format", nil)
		return
	}

	service, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil {
		utils.NotFoundResponse(c, "Service not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Service retrieved successfully", service, nil)
}

func (h *ServiceHandler) Create(c *gin.Context) {
	var service domain.Service
	if err := c.ShouldBindJSON(&service); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	if err := h.usecase.Create(c.Request.Context(), &service); err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Service created successfully", service, nil)
}

func (h *ServiceHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequestResponse(c, "Invalid UUID format", nil)
		return
	}

	var service domain.Service
	if err := c.ShouldBindJSON(&service); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	if err := h.usecase.Update(c.Request.Context(), id, &service); err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Service updated successfully", nil, nil)
}

func (h *ServiceHandler) Archive(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequestResponse(c, "Invalid UUID format", nil)
		return
	}

	if err := h.usecase.Archive(c.Request.Context(), id); err != nil {
		utils.InternalServerErrorResponse(c, "Failed to archive service", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Service archived successfully", nil, nil)
}
