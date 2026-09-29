package v1

import (
	"net/http"
	"strconv"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

type HRMSClaimHandler struct {
	usecase domain.HRMSClaimUsecase
}

func NewHRMSClaimHandler(usecase domain.HRMSClaimUsecase) *HRMSClaimHandler {
	return &HRMSClaimHandler{usecase: usecase}
}

func (h *HRMSClaimHandler) GetAll(c *gin.Context) {
	var filter domain.HRMSClaimFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.BadRequestResponse(c, "Parameter filter tidak valid", err.Error())
		return
	}

	claims, total, err := h.usecase.GetAll(c.Request.Context(), filter)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Gagal mengambil daftar laporan klaim & pengajuan dana", err.Error())
		return
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 15
	}
	page := filter.Page
	if page <= 0 {
		page = 1
	}

	meta := gin.H{
		"page":  page,
		"limit": limit,
		"total": total,
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar klaim & pengajuan dana berhasil diambil", claims, meta)
}

func (h *HRMSClaimHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.BadRequestResponse(c, "ID tidak valid", err.Error())
		return
	}

	claim, err := h.usecase.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		utils.NotFoundResponse(c, "Data pengajuan tidak ditemukan")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Detail pengajuan berhasil diambil", claim, nil)
}

func (h *HRMSClaimHandler) GetSummary(c *gin.Context) {
	summary, err := h.usecase.GetSummary(c.Request.Context())
	if err != nil {
		utils.InternalServerErrorResponse(c, "Gagal mengambil ringkasan statistik", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Ringkasan statistik berhasil diambil", summary, nil)
}

func (h *HRMSClaimHandler) Disburse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.BadRequestResponse(c, "ID tidak valid", err.Error())
		return
	}

	var req domain.DisburseClaimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Input pencairan dana tidak valid", err.Error())
		return
	}

	userIDVal, _ := c.Get("userID")
	var userID int64
	if idVal, ok := userIDVal.(int64); ok {
		userID = idVal
	}

	updated, err := h.usecase.Disburse(c.Request.Context(), uint(id), req, userID)
	if err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Pencairan dana berhasil dicatat oleh Finance", updated, nil)
}

func (h *HRMSClaimHandler) SyncFromHRMS(c *gin.Context) {
	var req domain.SyncHrmsRequest
	_ = c.ShouldBindJSON(&req)

	synced, err := h.usecase.SyncFromHRMS(c.Request.Context(), req)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Sinkronisasi gagal", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Sinkronisasi data HRMS SaaS berhasil dilakukan", gin.H{
		"synced_count": synced,
	}, nil)
}
