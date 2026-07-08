from typing import Dict, Any
import threading
import logging
import time

logger = logging.getLogger(__name__)

class MetricsService:
    def __init__(self):
        self._counters: Dict[str, int] = {
            "api_calls": 0,
            "login_count": 0,
            "registration_count": 0,
            "uploads": 0,
            "messages": 0,
            "errors": 0,
            "websocket_connections": 0,
            "health_checks": 0
        }
        self._latencies: Dict[str, list] = {}
        self._lock = threading.Lock()

    def increment(self, metric: str, amount: int = 1):
        with self._lock:
            if metric not in self._counters:
                self._counters[metric] = 0
            self._counters[metric] += amount

    def decrement(self, metric: str, amount: int = 1):
        with self._lock:
            if metric not in self._counters:
                self._counters[metric] = 0
            self._counters[metric] -= amount

    def record_latency(self, endpoint: str, duration_ms: float):
        with self._lock:
            if endpoint not in self._latencies:
                self._latencies[endpoint] = []
            # Keep only the last 1000 records to prevent memory leak
            if len(self._latencies[endpoint]) > 1000:
                self._latencies[endpoint].pop(0)
            self._latencies[endpoint].append(duration_ms)

    def get_metrics(self) -> Dict[str, Any]:
        with self._lock:
            avg_latencies = {}
            for endpoint, times in self._latencies.items():
                if times:
                    avg_latencies[endpoint] = sum(times) / len(times)
                else:
                    avg_latencies[endpoint] = 0.0

            return {
                "counters": dict(self._counters),
                "average_latencies_ms": avg_latencies,
                "timestamp": time.time()
            }
