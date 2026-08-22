package usecase

import (
	"context"
	"errors"

	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
)

type userUsecase struct {
	userRepo domain.UserRepository
}

func NewUserUsecase(userRepo domain.UserRepository) domain.UserUsecase {
	return &userUsecase{userRepo: userRepo}
}

func (u *userUsecase) GetAll(ctx context.Context, filter domain.UserFilter) ([]domain.User, int64, error) {
	return u.userRepo.GetAll(ctx, filter)
}

func (u *userUsecase) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	return u.userRepo.GetByID(ctx, id)
}

func (u *userUsecase) Create(ctx context.Context, req domain.RegisterRequest) (*domain.User, error) {
	existingUser, _ := u.userRepo.GetByUsername(ctx, req.Username)
	if existingUser != nil {
		return nil, errors.New("username is already taken")
	}

	existingEmail, _ := u.userRepo.GetByEmail(ctx, req.Email)
	if existingEmail != nil {
		return nil, errors.New("email is already registered")
	}

	role, err := u.userRepo.GetRoleByID(ctx, req.RoleID)
	if err != nil || role == nil {
		return nil, errors.New("invalid role ID")
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	newUser := &domain.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashedPassword,
		FullName:     req.FullName,
		RoleID:       req.RoleID,
		Role:         *role,
		Status:       "ACTIVE",
	}

	if err := u.userRepo.Create(ctx, newUser); err != nil {
		return nil, err
	}

	return newUser, nil
}

func (u *userUsecase) Update(ctx context.Context, id int64, user *domain.User) error {
	existing, err := u.userRepo.GetByID(ctx, id)
	if err != nil {
		return errors.New("user not found")
	}

	existing.FullName = user.FullName
	existing.Email = user.Email
	existing.RoleID = user.RoleID
	existing.Status = user.Status

	return u.userRepo.Update(ctx, existing)
}

func (u *userUsecase) Delete(ctx context.Context, id int64) error {
	return u.userRepo.Delete(ctx, id)
}

func (u *userUsecase) GetAllRoles(ctx context.Context) ([]domain.Role, error) {
	return u.userRepo.GetAllRoles(ctx)
}
