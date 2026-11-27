package middleware

import (
	"strings"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

// APIKeyAuthMiddleware validates requests using X-API-Key or Authorization: Bearer fspms_live_...
func APIKeyAuthMiddleware(apiKeyUsecase domain.APIKeyUsecase) gin.HandlerFunc {
	return func(c *gin.Context) {
		var rawKey string

		// 1. Check X-API-Key header
		if key := c.GetHeader("X-API-Key"); key != "" {
			rawKey = strings.TrimSpace(key)
		} else if authHeader := c.GetHeader("Authorization"); authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				rawKey = strings.TrimSpace(parts[1])
			}
		}

		if rawKey == "" {
			utils.UnauthorizedResponse(c, "Missing API Key. Please provide X-API-Key header or Bearer token.")
			c.Abort()
			return
		}

		apiKey, err := apiKeyUsecase.ValidateKey(c.Request.Context(), rawKey)
		if err != nil {
			utils.UnauthorizedResponse(c, "Authentication failed: "+err.Error())
			c.Abort()
			return
		}

		c.Set("isAPIKey", true)
		c.Set("apiKeyID", apiKey.ID.String())
		c.Set("apiKeyName", apiKey.Name)
		c.Set("scopes", apiKey.Scopes)
		c.Set("role", "api_client")

		c.Next()
	}
}

// FlexibleAuthMiddleware allows either standard JWT or API Key
func FlexibleAuthMiddleware(jwtSecret string, apiKeyUsecase domain.APIKeyUsecase) gin.HandlerFunc {
	jwtMiddleware := AuthMiddleware(jwtSecret)
	return func(c *gin.Context) {
		rawKey := c.GetHeader("X-API-Key")
		authHeader := c.GetHeader("Authorization")
		if rawKey == "" && strings.HasPrefix(strings.TrimPrefix(authHeader, "Bearer "), "fspms_") {
			rawKey = strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		}

		if rawKey != "" {
			apiKey, err := apiKeyUsecase.ValidateKey(c.Request.Context(), rawKey)
			if err != nil {
				utils.UnauthorizedResponse(c, "Invalid API Key: "+err.Error())
				c.Abort()
				return
			}
			c.Set("isAPIKey", true)
			c.Set("apiKeyID", apiKey.ID.String())
			c.Set("apiKeyName", apiKey.Name)
			c.Set("scopes", apiKey.Scopes)
			c.Set("role", "admin")
			c.Next()
			return
		}

		jwtMiddleware(c)
	}
}
