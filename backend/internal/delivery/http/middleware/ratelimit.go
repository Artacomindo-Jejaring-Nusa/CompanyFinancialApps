package middleware

import (
	"net/http"
	"sync"
	"time"

	"finance-webapps/backend/pkg/utils"
	"github.com/gin-gonic/gin"
)

type clientVisitor struct {
	lastSeen time.Time
	tokens   float64
}

type RateLimiter struct {
	sync.Mutex
	visitors map[string]*clientVisitor
	rate     float64 // tokens replenished per second
	capacity float64 // burst bucket capacity
}

func NewRateLimiter(rate float64, capacity float64) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*clientVisitor),
		rate:     rate,
		capacity: capacity,
	}

	// Periodically cleanup stale visitors every 5 minutes
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			rl.Lock()
			for ip, v := range rl.visitors {
				if time.Since(v.lastSeen) > 10*time.Minute {
					delete(rl.visitors, ip)
				}
			}
			rl.Unlock()
		}
	}()

	return rl
}

func (rl *RateLimiter) Allow(ip string) bool {
	rl.Lock()
	defer rl.Unlock()

	now := time.Now()
	v, exists := rl.visitors[ip]
	if !exists {
		rl.visitors[ip] = &clientVisitor{
			lastSeen: now,
			tokens:   rl.capacity - 1.0,
		}
		return true
	}

	// Refill tokens based on time elapsed
	elapsed := now.Sub(v.lastSeen).Seconds()
	v.lastSeen = now
	v.tokens += elapsed * rl.rate
	if v.tokens > rl.capacity {
		v.tokens = rl.capacity
	}

	if v.tokens >= 1.0 {
		v.tokens -= 1.0
		return true
	}

	return false
}

func RateLimitMiddleware(limiter *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !limiter.Allow(ip) {
			utils.ErrorResponse(c, http.StatusTooManyRequests, "Too many requests. Please slow down and try again later.", nil)
			c.Abort()
			return
		}
		c.Next()
	}
}
