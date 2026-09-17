package config

import (
	"os"
	"strconv"
	"strings"

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
	RedisPassword      string
	JWTSecret          string
	JWTExpirationHours int
	AllowedOrigins     []string
}

func LoadConfig() (*Config, error) {
	_ = godotenv.Load(".env")

	jwtExpHours, _ := strconv.Atoi(getEnv("JWT_EXPIRATION_HOURS", "24"))

	originsRaw := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:8080")
	var allowedOrigins []string
	for _, o := range strings.Split(originsRaw, ",") {
		if trimmed := strings.TrimSpace(o); trimmed != "" {
			allowedOrigins = append(allowedOrigins, trimmed)
		}
	}

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
		RedisPassword:      getEnv("REDIS_PASSWORD", "fspms_redis_secret_pass_2026"),
		JWTSecret:          getEnv("JWT_SECRET", "super_secret_jwt_key_fspms_2026"),
		JWTExpirationHours: jwtExpHours,
		AllowedOrigins:     allowedOrigins,
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val, exists := os.LookupEnv(key); exists {
		return val
	}
	return fallback
}
