package v1

import (
	"net/http"
	"strconv"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentScheduleHandler struct {
	usecase domain.PaymentScheduleUsecase
}

func NewPaymentScheduleHandler(usecase domain.PaymentScheduleUsecase) *PaymentScheduleHandler {
	return &PaymentScheduleHandler{usecase: usecase}
}

func (h *PaymentScheduleHandler) GetAll(c *gin.Context) {
	param := utils.GetPaginationParam(c)

	stID, _ := strconv.ParseInt(c.Query("service_type_id"), 10, 64)
	cID, _ := strconv.ParseInt(c.Query("customer_id"), 10, 64)
	pID, _ := strconv.ParseInt(c.Query("provider_id"), 10, 64)

	var sID *uuid.UUID
	if serviceIDStr := c.Query("service_id"); serviceIDStr != "" {
		if parsed, err := uuid.Parse(serviceIDStr); err == nil {
			sID = &parsed
		}
	}

	filter := domain.PaymentScheduleFilter{
		Status:        c.Query("status"),
		ServiceID:     sID,
		CustomerID:    cID,
		ProviderID:    pID,
		ServiceTypeID: stID,
		Search:        c.Query("search"),
		Page:          param.Page,
		Limit:         param.Limit,
	}

	schedules, total, err := h.usecase.GetAll(c.Request.Context(), filter)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to fetch payment schedules", err.Error())
		return
	}

	meta := utils.CalculateMeta(total, param)
	utils.SuccessResponse(c, http.StatusOK, "Payment schedules retrieved successfully", schedules, meta)
}

func (h *PaymentScheduleHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequestResponse(c, "Invalid UUID format", nil)
		return
	}

	schedule, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil {
		utils.NotFoundResponse(c, "Payment schedule not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Payment schedule retrieved successfully", schedule, nil)
}

func (h *PaymentScheduleHandler) MarkAsPaid(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		utils.UnauthorizedResponse(c, "Unauthorized")
		return
	}
	userID := userIDVal.(int64)

	var req domain.MarkAsPaidRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	schedule, err := h.usecase.MarkAsPaid(c.Request.Context(), req, userID)
	if err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Payment recorded successfully", schedule, nil)
}

func (h *PaymentScheduleHandler) BulkMarkAsPaid(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		utils.UnauthorizedResponse(c, "Unauthorized")
		return
	}
	userID := userIDVal.(int64)

	var req domain.BulkMarkAsPaidRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	successIDs, errMsgs, err := h.usecase.BulkMarkAsPaid(c.Request.Context(), req, userID)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to execute bulk payment", err.Error())
		return
	}

	respData := gin.H{
		"success_ids": successIDs,
		"errors":      errMsgs,
	}

	utils.SuccessResponse(c, http.StatusOK, "Bulk mark as paid executed", respData, nil)
}
