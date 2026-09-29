package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/logger"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type hrmsClaimUsecase struct {
	repo         domain.HRMSClaimRepository
	auditLogRepo domain.AuditLogRepository
	db           *gorm.DB
}

func NewHRMSClaimUsecase(repo domain.HRMSClaimRepository, auditLogRepo domain.AuditLogRepository, db *gorm.DB) domain.HRMSClaimUsecase {
	return &hrmsClaimUsecase{
		repo:         repo,
		auditLogRepo: auditLogRepo,
		db:           db,
	}
}

func (u *hrmsClaimUsecase) GetAll(ctx context.Context, filter domain.HRMSClaimFilter) ([]domain.HRMSClaim, int64, error) {
	return u.repo.GetAll(ctx, filter)
}

func (u *hrmsClaimUsecase) GetByID(ctx context.Context, id uint) (*domain.HRMSClaim, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *hrmsClaimUsecase) GetSummary(ctx context.Context) (*domain.HRMSClaimSummary, error) {
	return u.repo.GetSummary(ctx)
}

func (u *hrmsClaimUsecase) Disburse(ctx context.Context, id uint, req domain.DisburseClaimRequest, userID int64) (*domain.HRMSClaim, error) {
	claim, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("data klaim tidak ditemukan: %w", err)
	}

	if claim.Status != "APPROVED" && claim.Status != "DISBURSED" {
		return nil, fmt.Errorf("hanya pengajuan yang sudah disetujui (APPROVED) yang dapat dicairkan oleh Finance")
	}

	now := time.Now()
	claim.Status = "DISBURSED"
	claim.DisbursedAt = &now
	claim.DisbursedBy = req.DisbursedBy
	claim.DisbursedRef = req.DisbursedRef

	if err := u.repo.Update(ctx, claim); err != nil {
		return nil, fmt.Errorf("gagal memperbarui status pencairan dana: %w", err)
	}

	// Record Audit Log
	if u.auditLogRepo != nil {
		var uidPtr *int64
		if userID > 0 {
			uidPtr = &userID
		}
		newValJSON, _ := json.Marshal(map[string]interface{}{
			"amount":       claim.Amount,
			"disbursed_by": req.DisbursedBy,
			"ref":          req.DisbursedRef,
			"notes":        req.Notes,
		})

		_ = u.auditLogRepo.Create(ctx, &domain.AuditLog{
			ID:        uuid.New(),
			UserID:    uidPtr,
			Action:    "DISBURSE_HRMS_CLAIM",
			Entity:    "HRMSClaim",
			EntityID:  fmt.Sprintf("%d", claim.ID),
			NewValue:  newValJSON,
			Timestamp: now,
		})
	}

	return claim, nil
}

func (u *hrmsClaimUsecase) SyncFromHRMS(ctx context.Context, req domain.SyncHrmsRequest) (int, error) {
	baseURL := req.HrmsBaseURL
	if baseURL == "" {
		baseURL = "http://localhost:8000"
	}

	client := &http.Client{Timeout: 10 * time.Second}
	syncedCount := 0

	// 1. Sync Reimbursements
	reimbURL := fmt.Sprintf("%s/api/reimbursements", baseURL)
	reimbReq, _ := http.NewRequestWithContext(ctx, "GET", reimbURL, nil)
	reimbReq.Header.Set("Accept", "application/json")
	if req.APIToken != "" {
		reimbReq.Header.Set("Authorization", "Bearer "+req.APIToken)
	}

	reimbResp, err := client.Do(reimbReq)
	if err == nil && reimbResp.StatusCode == http.StatusOK {
		body, _ := io.ReadAll(reimbResp.Body)
		_ = reimbResp.Body.Close()

		var jsonResp struct {
			Data struct {
				Data []map[string]interface{} `json:"data"`
			} `json:"data"`
		}
		if err := json.Unmarshal(body, &jsonResp); err == nil && len(jsonResp.Data.Data) > 0 {
			var toUpsert []domain.HRMSClaim
			for _, item := range jsonResp.Data.Data {
				idVal := uint(0)
				if idFloat, ok := item["id"].(float64); ok {
					idVal = uint(idFloat)
				}
				refNo := fmt.Sprintf("REIMB-%04d", idVal)
				title, _ := item["title"].(string)
				empName, _ := item["employee_name"].(string)
				if empName == "" {
					if userMap, ok := item["user"].(map[string]interface{}); ok {
						empName, _ = userMap["name"].(string)
					}
				}
				dept, _ := item["divisi"].(string)
				desc, _ := item["description"].(string)
				amount := 0.0
				if amtFloat, ok := item["amount"].(float64); ok {
					amount = amtFloat
				}
				statusStr, _ := item["status"].(string)
				statusUpper := "PENDING"
				switch statusStr {
				case "approved":
					statusUpper = "APPROVED"
				case "rejected":
					statusUpper = "REJECTED"
				}

				priority, _ := item["priority"].(string)
				if priority == "" {
					priority = "Normal"
				}

				itemsJSON, _ := json.Marshal(item["items"])
				attachmentsJSON, _ := json.Marshal(item["attachments"])

				toUpsert = append(toUpsert, domain.HRMSClaim{
					SourceType:    "REIMBURSEMENT",
					ReferenceNo:   refNo,
					EmployeeName:  empName,
					Department:    dept,
					Title:         title,
					Description:   desc,
					Amount:        amount,
					Status:        statusUpper,
					Priority:      priority,
					Items:         string(itemsJSON),
					Attachments:   string(attachmentsJSON),
					CreatedAt:     time.Now(),
					UpdatedAt:     time.Now(),
				})
			}
			if len(toUpsert) > 0 {
				_ = u.repo.BatchUpsert(ctx, toUpsert)
				syncedCount += len(toUpsert)
			}
		}
	}

	// 2. Sync Fund Requests
	fundURL := fmt.Sprintf("%s/api/fund-requests", baseURL)
	fundReq, _ := http.NewRequestWithContext(ctx, "GET", fundURL, nil)
	fundReq.Header.Set("Accept", "application/json")
	if req.APIToken != "" {
		fundReq.Header.Set("Authorization", "Bearer "+req.APIToken)
	}

	fundResp, err := client.Do(fundReq)
	if err == nil && fundResp.StatusCode == http.StatusOK {
		body, _ := io.ReadAll(fundResp.Body)
		_ = fundResp.Body.Close()

		var jsonResp struct {
			Data struct {
				Data []map[string]interface{} `json:"data"`
			} `json:"data"`
		}
		if err := json.Unmarshal(body, &jsonResp); err == nil && len(jsonResp.Data.Data) > 0 {
			var toUpsert []domain.HRMSClaim
			for _, item := range jsonResp.Data.Data {
				idVal := uint(0)
				if idFloat, ok := item["id"].(float64); ok {
					idVal = uint(idFloat)
				}
				refNo := fmt.Sprintf("FUND-%04d", idVal)
				title, _ := item["title"].(string)
				if title == "" {
					title, _ = item["reason"].(string)
				}
				empName, _ := item["employee_name"].(string)
				if empName == "" {
					if userMap, ok := item["user"].(map[string]interface{}); ok {
						empName, _ = userMap["name"].(string)
					}
				}
				dept, _ := item["divisi"].(string)
				desc, _ := item["reason"].(string)
				amount := 0.0
				if amtFloat, ok := item["amount"].(float64); ok {
					amount = amtFloat
				}
				statusStr, _ := item["status"].(string)
				statusUpper := "PENDING"
				switch statusStr {
				case "approved", "approved_by_supervisor":
					statusUpper = "APPROVED"
				case "rejected":
					statusUpper = "REJECTED"
				}

				priority, _ := item["priority"].(string)
				if priority == "" {
					priority = "Normal"
				}

				itemsJSON, _ := json.Marshal(item["items"])
				attachmentsJSON, _ := json.Marshal(item["attachments"])

				toUpsert = append(toUpsert, domain.HRMSClaim{
					SourceType:    "FUND_REQUEST",
					ReferenceNo:   refNo,
					EmployeeName:  empName,
					Department:    dept,
					Title:         title,
					Description:   desc,
					Amount:        amount,
					Status:        statusUpper,
					Priority:      priority,
					Items:         string(itemsJSON),
					Attachments:   string(attachmentsJSON),
					CreatedAt:     time.Now(),
					UpdatedAt:     time.Now(),
				})
			}
			if len(toUpsert) > 0 {
				_ = u.repo.BatchUpsert(ctx, toUpsert)
				syncedCount += len(toUpsert)
			}
		}
	}

	logger.Log.Info(fmt.Sprintf("Sync from HRMS completed: %d claims processed", syncedCount))
	return syncedCount, nil
}
