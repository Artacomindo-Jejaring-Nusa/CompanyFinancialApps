package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestJWTGenerateAndValidate(t *testing.T) {
	secret := "test_secret_key"
	userID := int64(10)
	username := "testuser"
	email := "test@example.com"
	role := "admin"
	expHours := 2

	tokenStr, err := GenerateToken(userID, username, email, role, secret, expHours)
	assert.NoError(t, err)
	assert.NotEmpty(t, tokenStr)

	claims, err := ValidateToken(tokenStr, secret)
	assert.NoError(t, err)
	assert.NotNil(t, claims)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, username, claims.Username)
	assert.Equal(t, email, claims.Email)
	assert.Equal(t, role, claims.Role)
}

func TestJWTInvalidSecretKey(t *testing.T) {
	secret := "test_secret_key"
	wrongSecret := "wrong_secret_key"

	tokenStr, err := GenerateToken(1, "user", "u@e.com", "staff", secret, 1)
	assert.NoError(t, err)

	_, err = ValidateToken(tokenStr, wrongSecret)
	assert.Error(t, err)
}
