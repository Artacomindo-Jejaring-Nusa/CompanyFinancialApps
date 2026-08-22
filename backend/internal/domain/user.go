package domain

import (
	"context"
	"time"
)

type Role struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"unique;not null"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type User struct {
	ID           int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Username     string    `json:"username" gorm:"unique;not null"`
	Email        string    `json:"email" gorm:"unique;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	FullName     string    `json:"full_name" gorm:"not null"`
	RoleID       int       `json:"role_id" gorm:"not null"`
	Role         Role      `json:"role" gorm:"foreignKey:RoleID"`
	Status       string    `json:"status" gorm:"default:'ACTIVE'"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
	RoleID   int    `json:"role_id" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type UserFilter struct {
	Search string
	RoleID int
	Status string
	Page   int
	Limit  int
}

type UserRepository interface {
	GetByID(ctx context.Context, id int64) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetAll(ctx context.Context, filter UserFilter) ([]User, int64, error)
	Create(ctx context.Context, user *User) error
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id int64) error
	GetRoleByID(ctx context.Context, roleID int) (*Role, error)
	GetAllRoles(ctx context.Context) ([]Role, error)
}

type AuthUsecase interface {
	Login(ctx context.Context, req LoginRequest) (*AuthResponse, error)
	Register(ctx context.Context, req RegisterRequest) (*User, error)
	GetProfile(ctx context.Context, userID int64) (*User, error)
}

type UserUsecase interface {
	GetAll(ctx context.Context, filter UserFilter) ([]User, int64, error)
	GetByID(ctx context.Context, id int64) (*User, error)
	Create(ctx context.Context, req RegisterRequest) (*User, error)
	Update(ctx context.Context, id int64, user *User) error
	Delete(ctx context.Context, id int64) error
	GetAllRoles(ctx context.Context) ([]Role, error)
}
