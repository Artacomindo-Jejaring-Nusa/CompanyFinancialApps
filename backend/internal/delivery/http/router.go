package http

import (
	"finance-webapps/backend/config"
	"finance-webapps/backend/internal/delivery/http/middleware"
	v1 "finance-webapps/backend/internal/delivery/http/v1"
	"github.com/gin-gonic/gin"
)

type RouterDependencies struct {
	Config                 *config.Config
	AuthHandler            *v1.AuthHandler
	UserHandler            *v1.UserHandler
	CustomerHandler        *v1.CustomerHandler
	ProviderHandler        *v1.ProviderHandler
	ServiceTypeHandler     *v1.ServiceTypeHandler
	ServiceHandler         *v1.ServiceHandler
	PaymentScheduleHandler *v1.PaymentScheduleHandler
	DashboardHandler       *v1.DashboardHandler
	ReportHandler          *v1.ReportHandler
	AuditLogHandler        *v1.AuditLogHandler
}

func SetupRouter(deps *RouterDependencies) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "UP", "system": "FSPMS Backend API"})
	})

	apiV1 := r.Group("/api/v1")
	{
		// Public Auth routes
		authGroup := apiV1.Group("/auth")
		{
			authGroup.POST("/login", deps.AuthHandler.Login)
		}

		// Protected routes
		protected := apiV1.Group("")
		protected.Use(middleware.AuthMiddleware(deps.Config.JWTSecret))
		{
			protected.GET("/auth/profile", deps.AuthHandler.GetProfile)

			// Dashboard Summary API
			protected.GET("/dashboard/summary", deps.DashboardHandler.GetSummary)

			// Roles API
			protected.GET("/roles", deps.UserHandler.GetAllRoles)

			// User Management API (Admin only)
			users := protected.Group("/users")
			users.Use(middleware.RequireRole("admin"))
			{
				users.GET("", deps.UserHandler.GetAll)
				users.GET("/:id", deps.UserHandler.GetByID)
				users.POST("", deps.UserHandler.Create)
				users.PUT("/:id", deps.UserHandler.Update)
				users.DELETE("/:id", deps.UserHandler.Delete)
			}

			// Customers API
			customers := protected.Group("/customers")
			{
				customers.GET("", deps.CustomerHandler.GetAll)
				customers.GET("/:id", deps.CustomerHandler.GetByID)
				customers.POST("", middleware.RequireRole("admin", "finance_staff", "finance_supervisor"), deps.CustomerHandler.Create)
				customers.PUT("/:id", middleware.RequireRole("admin", "finance_staff", "finance_supervisor"), deps.CustomerHandler.Update)
				customers.DELETE("/:id", middleware.RequireRole("admin", "finance_supervisor"), deps.CustomerHandler.Delete)
			}

			// Providers API
			providers := protected.Group("/providers")
			{
				providers.GET("", deps.ProviderHandler.GetAll)
				providers.GET("/:id", deps.ProviderHandler.GetByID)
				providers.POST("", middleware.RequireRole("admin", "finance_staff", "finance_supervisor"), deps.ProviderHandler.Create)
				providers.PUT("/:id", middleware.RequireRole("admin", "finance_staff", "finance_supervisor"), deps.ProviderHandler.Update)
				providers.DELETE("/:id", middleware.RequireRole("admin", "finance_supervisor"), deps.ProviderHandler.Delete)
			}

			// Service Types API
			serviceTypes := protected.Group("/service-types")
			{
				serviceTypes.GET("", deps.ServiceTypeHandler.GetAll)
				serviceTypes.GET("/:id", deps.ServiceTypeHandler.GetByID)
				serviceTypes.POST("", middleware.RequireRole("admin"), deps.ServiceTypeHandler.Create)
				serviceTypes.PUT("/:id", middleware.RequireRole("admin"), deps.ServiceTypeHandler.Update)
				serviceTypes.DELETE("/:id", middleware.RequireRole("admin"), deps.ServiceTypeHandler.Delete)
			}

			// Services API
			services := protected.Group("/services")
			{
				services.GET("", deps.ServiceHandler.GetAll)
				services.GET("/:id", deps.ServiceHandler.GetByID)
				services.POST("", middleware.RequireRole("admin", "finance_staff", "finance_supervisor"), deps.ServiceHandler.Create)
				services.PUT("/:id", middleware.RequireRole("admin", "finance_staff", "finance_supervisor"), deps.ServiceHandler.Update)
				services.DELETE("/:id", middleware.RequireRole("admin", "finance_supervisor"), deps.ServiceHandler.Archive)
			}

			// Payment Schedules API
			payments := protected.Group("/payment-schedules")
			{
				payments.GET("", deps.PaymentScheduleHandler.GetAll)
				payments.GET("/:id", deps.PaymentScheduleHandler.GetByID)
				payments.POST("/mark-as-paid", middleware.RequireRole("admin", "finance_staff", "finance_supervisor"), deps.PaymentScheduleHandler.MarkAsPaid)
				payments.POST("/bulk-mark-as-paid", middleware.RequireRole("admin", "finance_staff", "finance_supervisor"), deps.PaymentScheduleHandler.BulkMarkAsPaid)
			}

			// Reports API
			reports := protected.Group("/reports")
			{
				reports.GET("/monthly-summary", deps.ReportHandler.GetMonthlySummary)
				reports.GET("/provider-summary", deps.ReportHandler.GetProviderSummary)
				reports.GET("/overdue-aging", deps.ReportHandler.GetOverdueAging)
			}

			// Audit Logs API
			protected.GET("/audit-logs", middleware.RequireRole("admin", "finance_supervisor", "finance_manager", "auditor"), deps.AuditLogHandler.GetAll)
		}
	}

	return r
}
