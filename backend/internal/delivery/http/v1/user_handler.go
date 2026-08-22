package v1

import (
	"net/http"
	"strconv"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	usecase domain.UserUsecase
}

func NewUserHandler(usecase domain.UserUsecase) *UserHandler {
	return &UserHandler{usecase: usecase}
}

func (h *UserHandler) GetAll(c *gin.Context) {
	param := utils.GetPaginationParam(c)
	roleID, _ := strconv.Atoi(c.Query("role_id"))

	filter := domain.UserFilter{
		Search: c.Query("search"),
		RoleID: roleID,
		Status: c.Query("status"),
		Page:   param.Page,
		Limit:  param.Limit,
	}

	users, total, err := h.usecase.GetAll(c.Request.Context(), filter)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to fetch users", err.Error())
		return
	}

	meta := utils.CalculateMeta(total, param)
	utils.SuccessResponse(c, http.StatusOK, "Users retrieved successfully", users, meta)
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	user, err := h.usecase.GetByID(c.Request.Context(), id)
	if err != nil {
		utils.NotFoundResponse(c, "User not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User retrieved successfully", user, nil)
}

func (h *UserHandler) Create(c *gin.Context) {
	var req domain.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	user, err := h.usecase.Create(c.Request.Context(), req)
	if err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "User created successfully", user, nil)
}

func (h *UserHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	var user domain.User
	if err := c.ShouldBindJSON(&user); err != nil {
		utils.BadRequestResponse(c, "Invalid input data", err.Error())
		return
	}

	if err := h.usecase.Update(c.Request.Context(), id, &user); err != nil {
		utils.BadRequestResponse(c, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User updated successfully", nil, nil)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid ID format", nil)
		return
	}

	if err := h.usecase.Delete(c.Request.Context(), id); err != nil {
		utils.InternalServerErrorResponse(c, "Failed to deactivate user", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User deactivated successfully", nil, nil)
}

func (h *UserHandler) GetAllRoles(c *gin.Context) {
	roles, err := h.usecase.GetAllRoles(c.Request.Context())
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to fetch roles", err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Roles retrieved successfully", roles, nil)
}
