package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"finance-webapps/backend/config"
	deliveryHttp "finance-webapps/backend/internal/delivery/http"
	v1 "finance-webapps/backend/internal/delivery/http/v1"
	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/internal/repository"
	"finance-webapps/backend/internal/usecase"
	"finance-webapps/backend/pkg/database"
	"finance-webapps/backend/pkg/logger"
	"finance-webapps/backend/pkg/utils"
)

func main() {
	logger.InitLogger()
	logger.Log.Info("Starting FSPMS Backend Application (Enterprise Ready)...")

	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// Seed Admin User if not exists
	seedInitialData()

	// Repositories
	userRepo := repository.NewUserRepository(db)
	customerRepo := repository.NewCustomerRepository(db)
	providerRepo := repository.NewProviderRepository(db)
	serviceTypeRepo := repository.NewServiceTypeRepository(db)
	serviceRepo := repository.NewServiceRepository(db)
	paymentScheduleRepo := repository.NewPaymentScheduleRepository(db)
	paymentHistoryRepo := repository.NewPaymentHistoryRepository(db)
	auditLogRepo := repository.NewAuditLogRepository(db)

	// Usecases
	authUsecase := usecase.NewAuthUsecase(userRepo, cfg)
	userUsecase := usecase.NewUserUsecase(userRepo)
	customerUsecase := usecase.NewCustomerUsecase(customerRepo, auditLogRepo)
	providerUsecase := usecase.NewProviderUsecase(providerRepo, auditLogRepo)
	serviceTypeUsecase := usecase.NewServiceTypeUsecase(serviceTypeRepo)
	paymentScheduleUsecase := usecase.NewPaymentScheduleUsecase(paymentScheduleRepo, paymentHistoryRepo, auditLogRepo)
	serviceUsecase := usecase.NewServiceUsecase(serviceRepo, paymentScheduleRepo, auditLogRepo)
	dashboardUsecase := usecase.NewDashboardUsecase(db)
	reportUsecase := usecase.NewReportUsecase(db)

	// Handlers
	authHandler := v1.NewAuthHandler(authUsecase)
	userHandler := v1.NewUserHandler(userUsecase)
	customerHandler := v1.NewCustomerHandler(customerUsecase)
	providerHandler := v1.NewProviderHandler(providerUsecase)
	serviceTypeHandler := v1.NewServiceTypeHandler(serviceTypeUsecase)
	serviceHandler := v1.NewServiceHandler(serviceUsecase)
	paymentScheduleHandler := v1.NewPaymentScheduleHandler(paymentScheduleUsecase)
	dashboardHandler := v1.NewDashboardHandler(dashboardUsecase)
	reportHandler := v1.NewReportHandler(reportUsecase)
	auditLogHandler := v1.NewAuditLogHandler(auditLogRepo)

	// Router
	router := deliveryHttp.SetupRouter(&deliveryHttp.RouterDependencies{
		Config:                 cfg,
		AuthHandler:            authHandler,
		UserHandler:            userHandler,
		CustomerHandler:        customerHandler,
		ProviderHandler:        providerHandler,
		ServiceTypeHandler:     serviceTypeHandler,
		ServiceHandler:         serviceHandler,
		PaymentScheduleHandler: paymentScheduleHandler,
		DashboardHandler:       dashboardHandler,
		ReportHandler:          reportHandler,
		AuditLogHandler:        auditLogHandler,
	})

	listenAddr := fmt.Sprintf(":%s", cfg.ServerPort)
	srv := &http.Server{
		Addr:         listenAddr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Channel for Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Log.Info("Server listening on " + listenAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server ListenAndServe error: %v", err)
		}
	}()

	<-quit
	logger.Log.Info("Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Log.Error("Server forced to shutdown: " + err.Error())
	}

	// Close DB connection pool cleanly
	if sqlDB, err := db.DB(); err == nil {
		_ = sqlDB.Close()
		logger.Log.Info("Database connection pool closed.")
	}

	logger.Log.Info("FSPMS Backend Application stopped cleanly.")
}

func seedInitialData() {
	ctx := context.Background()
	userRepo := repository.NewUserRepository(database.DB)

	user, _ := userRepo.GetByUsername(ctx, "admin")
	if user == nil {
		hashedPass, _ := utils.HashPassword("admin123")
		adminUser := &domain.User{
			Username:     "admin",
			Email:        "admin@fspms.com",
			PasswordHash: hashedPass,
			FullName:     "System Administrator",
			RoleID:       1,
			Status:       "ACTIVE",
		}
		_ = userRepo.Create(ctx, adminUser)
		logger.Log.Info("Seeded default admin user (admin / admin123)")
	}

	// Seed Service Type: Kartu Pascabayar & GSM if not exists
	var stCount int64
	database.DB.Model(&domain.ServiceType{}).Where("name = ?", "Kartu Pascabayar & GSM").Count(&stCount)
	if stCount == 0 {
		newST := domain.ServiceType{
			ID:     5,
			Name:   "Kartu Pascabayar & GSM",
			Status: "ACTIVE",
		}
		_ = database.DB.Create(&newST)
		logger.Log.Info("Seeded service type: Kartu Pascabayar & GSM")
	}

	// Seed Popular Cellular Providers if not exist
	cellularProviders := []struct {
		Code string
		Name string
	}{
		{"PROV-TSEL", "Telkomsel (Halo / Corporate IoT SIM)"},
		{"PROV-ISAT", "Indosat Ooredoo Hutchison (Matrix / Postpaid)"},
		{"PROV-XL", "XL Prioritas (Axiata)"},
		{"PROV-SMART", "Smartfren Pascabayar"},
	}

	for _, cp := range cellularProviders {
		var pCount int64
		database.DB.Model(&domain.Provider{}).Where("provider_code = ? OR provider_name = ?", cp.Code, cp.Name).Count(&pCount)
		if pCount == 0 {
			newP := domain.Provider{
				ProviderCode: cp.Code,
				ProviderName: cp.Name,
				Status:       "ACTIVE",
			}
			_ = database.DB.Create(&newP)
			logger.Log.Info("Seeded cellular provider: " + cp.Name)
		}
	}
}
