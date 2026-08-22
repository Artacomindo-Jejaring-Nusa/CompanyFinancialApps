package usecase

import (
	"context"

	"finance-webapps/backend/internal/domain"
)

type serviceTypeUsecase struct {
	repo domain.ServiceTypeRepository
}

func NewServiceTypeUsecase(repo domain.ServiceTypeRepository) domain.ServiceTypeUsecase {
	return &serviceTypeUsecase{repo: repo}
}

func (u *serviceTypeUsecase) GetAll(ctx context.Context) ([]domain.ServiceType, error) {
	return u.repo.GetAll(ctx)
}

func (u *serviceTypeUsecase) GetByID(ctx context.Context, id int64) (*domain.ServiceType, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *serviceTypeUsecase) Create(ctx context.Context, st *domain.ServiceType) error {
	if st.Status == "" {
		st.Status = "ACTIVE"
	}
	return u.repo.Create(ctx, st)
}

func (u *serviceTypeUsecase) Update(ctx context.Context, id int64, st *domain.ServiceType) error {
	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	existing.Name = st.Name
	existing.AttributeSchema = st.AttributeSchema
	existing.Status = st.Status
	return u.repo.Update(ctx, existing)
}

func (u *serviceTypeUsecase) Delete(ctx context.Context, id int64) error {
	return u.repo.Delete(ctx, id)
}
