package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHashPasswordAndCheck(t *testing.T) {
	password := "SecretPass123!"

	hash, err := HashPassword(password)
	assert.NoError(t, err)
	assert.NotEmpty(t, hash)

	assert.True(t, CheckPasswordHash(password, hash))
	assert.False(t, CheckPasswordHash("WrongPassword", hash))
}
