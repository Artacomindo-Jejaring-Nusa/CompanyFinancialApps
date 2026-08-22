package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

type PaginationParam struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

type PaginationMeta struct {
	CurrentPage int   `json:"current_page"`
	Limit       int   `json:"limit"`
	TotalItems  int64 `json:"total_items"`
	TotalPages  int   `json:"total_pages"`
}

func GetPaginationParam(c *gin.Context) PaginationParam {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	return PaginationParam{
		Page:  page,
		Limit: limit,
	}
}

func CalculateMeta(totalItems int64, param PaginationParam) PaginationMeta {
	totalPages := int(totalItems) / param.Limit
	if int(totalItems)%param.Limit != 0 {
		totalPages++
	}

	return PaginationMeta{
		CurrentPage: param.Page,
		Limit:       param.Limit,
		TotalItems:  totalItems,
		TotalPages:  totalPages,
	}
}
