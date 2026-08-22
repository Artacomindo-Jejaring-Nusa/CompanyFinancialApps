package middleware

import (
	"strings"

	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(secretKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.UnauthorizedResponse(c, "Authorization header is required")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.UnauthorizedResponse(c, "Authorization header format must be Bearer {token}")
			c.Abort()
			return
		}

		tokenStr := parts[1]
		claims, err := utils.ValidateToken(tokenStr, secretKey)
		if err != nil {
			utils.UnauthorizedResponse(c, "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		c.Next()
	}
}

func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			utils.ForbiddenResponse(c, "User role context missing")
			c.Abort()
			return
		}

		userRole, ok := roleVal.(string)
		if !ok {
			utils.ForbiddenResponse(c, "Invalid user role type")
			c.Abort()
			return
		}

		for _, role := range allowedRoles {
			if strings.EqualFold(role, userRole) || strings.EqualFold(userRole, "admin") {
				c.Next()
				return
			}
		}

		utils.ForbiddenResponse(c, "Access forbidden for your role")
		c.Abort()
	}
}
