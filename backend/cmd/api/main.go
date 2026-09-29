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
	hrmsClaimRepo := repository.NewHRMSClaimRepository(db)

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
	hrmsClaimUsecase := usecase.NewHRMSClaimUsecase(hrmsClaimRepo, auditLogRepo, db)

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
	hrmsClaimHandler := v1.NewHRMSClaimHandler(hrmsClaimUsecase)

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
		HRMSClaimHandler:       hrmsClaimHandler,
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

	// Seed Sample HRMS Claims and Fund Requests if table is empty
	var claimCount int64
	database.DB.Model(&domain.HRMSClaim{}).Count(&claimCount)
	if claimCount == 0 {
		now := time.Now()
		approvedTime := now.Add(-48 * time.Hour)
		disbursedTime := now.Add(-24 * time.Hour)

		sampleClaims := []domain.HRMSClaim{
			{
				SourceType:    "REIMBURSEMENT",
				ReferenceNo:   "CLM-2026-001",
				EmployeeName:  "Budi Santoso",
				EmployeeEmail: "budi.santoso@artacom.id",
				Department:    "Field Operations & Fiber",
				Title:         "Reimbursement BBM & Tol Site Visit Balaraja & Parahyangan",
				Description:   "Penggantian bensin dan tarif tol operational maintenance FO trunk link DC Parahyangan.",
				Amount:        450000,
				Status:        "APPROVED",
				Priority:      "Normal",
				ApprovedBy:    "Manager HRD & Ops",
				ApprovedAt:    &approvedTime,
				Items:         `[{"name":"BBM Pertamax Mobil Operasional","qty":1,"price":300000,"total":300000},{"name":"Tol JORR & Tol Jakarta-Tangerang","qty":1,"price":150000,"total":150000}]`,
				CreatedAt:     now.Add(-72 * time.Hour),
				UpdatedAt:     now.Add(-48 * time.Hour),
			},
			{
				SourceType:    "REIMBURSEMENT",
				ReferenceNo:   "CLM-2026-002",
				EmployeeName:  "Ahmad Rizki",
				EmployeeEmail: "ahmad.rizki@artacom.id",
				Department:    "Network Engineering & NOC",
				Title:         "Penggantian Pembelian Patch Cord Fiber Optic & SFP Urgent",
				Description:   "Pengadaan mendadak 4 pcs SFP 10G dan 10 pcs patch cord LC-LC saat mitigasi kabel putus di Woodland.",
				Amount:        1250000,
				Status:        "DISBURSED",
				Priority:      "High",
				ApprovedBy:    "Direktur Operasional",
				ApprovedAt:    &approvedTime,
				DisbursedAt:   &disbursedTime,
				DisbursedBy:   "Finance Team (BCA Transfer)",
				DisbursedRef:  "DISB-BCA-20260927-001",
				Items:         `[{"name":"SFP+ 10G 10km Cisco Compatible","qty":2,"price":450000,"total":900000},{"name":"Patch Cord Fiber LC-LC Duplex 3M","qty":5,"price":70000,"total":350000}]`,
				CreatedAt:     now.Add(-96 * time.Hour),
				UpdatedAt:     disbursedTime,
			},
			{
				SourceType:    "REIMBURSEMENT",
				ReferenceNo:   "CLM-2026-003",
				EmployeeName:  "Siti Rahma",
				EmployeeEmail: "siti.rahma@artacom.id",
				Department:    "Sales & Enterprise Account",
				Title:         "Reimbursement Jamuan Meeting Klien Korporat Bank BCA",
				Description:   "Jamuan makan siang & koordinasi SLA renewal kontrak FO 12 site dengan tim IT Infrastructure BCA.",
				Amount:        820000,
				Status:        "PENDING",
				Priority:      "Normal",
				Items:         `[{"name":"Jamuan Business Lunch Meeting","qty":1,"price":820000,"total":820000}]`,
				CreatedAt:     now.Add(-24 * time.Hour),
				UpdatedAt:     now.Add(-24 * time.Hour),
			},
			{
				SourceType:    "FUND_REQUEST",
				ReferenceNo:   "FND-2026-001",
				EmployeeName:  "Dedi Kurniawan",
				EmployeeEmail: "dedi.k@artacom.id",
				Department:    "Project & Implementation",
				Title:         "Pengajuan Kasbon Dana Tarik Kabel FO Fatmawati - Cilandak",
				Description:   "Uang muka operasional tim lapangan untuk perizinan warga, sewa scaffolding, dan konsumsi tim penarikan kabel.",
				Amount:        3500000,
				Status:        "APPROVED",
				Priority:      "High",
				ApprovedBy:    "General Manager",
				ApprovedAt:    &approvedTime,
				Items:         `[{"name":"Biaya Perizinan Lingkungan & RT/RW","qty":1,"price":1500000,"total":1500000},{"name":"Sewa Alat Bantu & Scaffolding 3 Hari","qty":1,"price":1200000,"total":1200000},{"name":"Uang Makan & Lembur Lapangan 4 Teknisi","qty":1,"price":800000,"total":800000}]`,
				CreatedAt:     now.Add(-48 * time.Hour),
				UpdatedAt:     approvedTime,
			},
			{
				SourceType:    "FUND_REQUEST",
				ReferenceNo:   "FND-2026-002",
				EmployeeName:  "Rian Hidayat",
				EmployeeEmail: "rian.h@artacom.id",
				Department:    "Facilities & Data Center",
				Title:         "Pengajuan Dana Sewa Genset & Backup Power DC Parahyangan",
				Description:   "Sewa genset mobile 50 KVA selama pemadaman terencana PLN di area Parahyangan.",
				Amount:        5000000,
				Status:        "DISBURSED",
				Priority:      "Urgent",
				ApprovedBy:    "Direktur Operasional",
				ApprovedAt:    &approvedTime,
				DisbursedAt:   &disbursedTime,
				DisbursedBy:   "Finance Team (Mandiri Transfer)",
				DisbursedRef:  "DISB-MDR-20260927-004",
				Items:         `[{"name":"Sewa Genset 50 KVA Silent 24 Jam","qty":1,"price":3800000,"total":3800000},{"name":"Bahan Bakar Solar Industri 100 Liter","qty":1,"price":1200000,"total":1200000}]`,
				CreatedAt:     now.Add(-120 * time.Hour),
				UpdatedAt:     disbursedTime,
			},
			{
				SourceType:    "FUND_REQUEST",
				ReferenceNo:   "FND-2026-003",
				EmployeeName:  "Fajar Nugraha",
				EmployeeEmail: "fajar.n@artacom.id",
				Department:    "HSE & Compliance",
				Title:         "Pengajuan Dana Pembelian APAR & Safety Harness Tower",
				Description:   "Penggantian APAR CO2 kadaluarsa di 3 POP dan 2 set safety harness climbing baru.",
				Amount:        2100000,
				Status:        "PENDING",
				Priority:      "Normal",
				Items:         `[{"name":"Refill & Pengadaan APAR CO2 5Kg","qty":3,"price":350000,"total":1050000},{"name":"Safety Full Body Harness Double Lanyard","qty":2,"price":525000,"total":1050000}]`,
				CreatedAt:     now.Add(-12 * time.Hour),
				UpdatedAt:     now.Add(-12 * time.Hour),
			},
		}

		for _, sc := range sampleClaims {
			_ = database.DB.Create(&sc)
		}
		logger.Log.Info("Seeded initial sample HRMS Claims & Fund Requests")
	}
}
