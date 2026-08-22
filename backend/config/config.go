package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort         string
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBSSLMode          string
	RedisHost          string
	RedisPort          string
	JWTSecret          string
	JWTExpirationHours int
}

func LoadConfig() (*Config, error) {
	_ = godotenv.Load(".env")

	jwtExpHours, _ := strconv.Atoi(getEnv("JWT_EXPIRATION_HOURS", "24"))

	cfg := &Config{
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBPort:             getEnv("DB_PORT", "5432"),
		DBUser:             getEnv("DB_USER", "fspms_user"),
		DBPassword:         getEnv("DB_PASSWORD", "fspms_password"),
		DBName:             getEnv("DB_NAME", "fspms_db"),
		DBSSLMode:          getEnv("DB_SSLMODE", "disable"),
		RedisHost:          getEnv("REDIS_HOST", "localhost"),
		RedisPort:          getEnv("REDIS_PORT", "6379"),
		JWTSecret:          getEnv("JWT_SECRET", "super_secret_jwt_key_fspms_2026"),
		JWTExpirationHours: jwtExpHours,
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val, exists := os.LookupEnv(key); exists {
		return val
	}
	return fallback
}
