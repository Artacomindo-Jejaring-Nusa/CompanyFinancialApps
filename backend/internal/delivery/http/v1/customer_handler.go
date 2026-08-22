package v1

import (
	"net/http"
	"strconv"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

type CustomerHandler struct {
	usecase domain.CustomerUsecase
}

func NewCustomerHandler(usecase domain.CustomerUsecase) *CustomerHandler {
	return &CustomerHandler{usecase: usecase}
}

func (h *CustomerHandler) GetAll(c *gin.Context) {
	param := utils.GetPaginationParam(c)
	filter := domain.CustomerFilter{
		Search: c.Query("search"),
		Status: c.Query("status"),
		Page:   param.Page,
		Limit:  param.Limit,
	}

	customers, total, err := h.usecase.GetAll(c.Request.Context(), filter)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to fetch customers", err.Error())
		return
	}

	meta := utils.CalculateMeta(total, param)
	utils.SuccessResponse(c, http.StatusOK, "Customers retrieved successfully", customers, meta)
}

func (h *CustomerHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	customer, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil {
		utils.NotFoundResponse(c, "Customer not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Customer retrieved successfully", customer, nil)
}

func (h *CustomerHandler) Create(c *gin.Context) {
	var customer domain.Customer
	if err := c.ShouldBindJSON(&customer); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	if err := h.usecase.Create(c.Request.Context(), &customer); err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Customer created successfully", customer, nil)
}

func (h *CustomerHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	var customer domain.Customer
	if err := c.ShouldBindJSON(&customer); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	if err := h.usecase.Update(c.Request.Context(), id, &customer); err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Customer updated successfully", nil, nil)
}

func (h *CustomerHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	if err := h.usecase.Delete(c.Request.Context(), id); err != nil {
		utils.InternalServerErrorResponse(c, "Failed to delete customer", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Customer deleted successfully", nil, nil)
}
