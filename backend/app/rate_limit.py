"""
ReklamAI v2.0 — Simple In-Memory Rate Limiter
Uses a sliding-window counter per IP address.
For production with multiple workers, use Redis instead.
"""
import time
from collections import defaultdict
from fastapi import Request, HTTPException


class RateLimiter:
    """Simple in-memory rate limiter (sliding window)."""

    def __init__(self):
        # { key: [(timestamp, ...)] }
        self._hits: dict[str, list[float]] = defaultdict(list)

    def _cleanup(self, key: str, window: float):
        cutoff = time.monotonic() - window
        self._hits[key] = [t for t in self._hits[key] if t > cutoff]

    def check(self, key: str, max_requests: int, window_seconds: float) -> bool:
        """Return True if request is allowed, False if rate-limited."""
        now = time.monotonic()
        self._cleanup(key, window_seconds)
        if len(self._hits[key]) >= max_requests:
            return False
        self._hits[key].append(now)
        return True


# Singleton
_limiter = RateLimiter()


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit_auth(request: Request):
    """Rate limit for auth endpoints: 10 requests per minute per IP."""
    ip = _get_client_ip(request)
    if not _limiter.check(f"auth:{ip}", max_requests=10, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests. Try again later.")


def rate_limit_generate(request: Request):
    """Rate limit for generation: 5 requests per minute per IP."""
    ip = _get_client_ip(request)
    if not _limiter.check(f"gen:{ip}", max_requests=5, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many generation requests. Try again later.")
