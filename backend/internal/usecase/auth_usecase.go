package usecase

import (
	"context"
	"errors"

	"finance-webapps/backend/config"
	"finance-webapps/backend/internal/domain"
	"finance-webapps/backend/pkg/utils"
)

type authUsecase struct {
	userRepo domain.UserRepository
	cfg      *config.Config
}

func NewAuthUsecase(userRepo domain.UserRepository, cfg *config.Config) domain.AuthUsecase {
	return &authUsecase{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (u *authUsecase) Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error) {
	user, err := u.userRepo.GetByUsername(ctx, req.Username)
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid username or password")
	}

	if user.Status != "ACTIVE" {
		return nil, errors.New("user account is inactive")
	}

	token, err := utils.GenerateToken(
		user.ID,
		user.Username,
		user.Email,
		user.Role.Name,
		u.cfg.JWTSecret,
		u.cfg.JWTExpirationHours,
	)

	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (u *authUsecase) Register(ctx context.Context, req domain.RegisterRequest) (*domain.User, error) {
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

func (u *authUsecase) GetProfile(ctx context.Context, userID int64) (*domain.User, error) {
	return u.userRepo.GetByID(ctx, userID)
}
