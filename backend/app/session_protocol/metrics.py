from app.metrics.service import MetricsService

class SessionMetrics:
    def __init__(self, metrics: MetricsService):
        self.metrics = metrics

    def record_handshake_started(self):
        self.metrics.increment("sssp_handshake_started")

    def record_handshake_success(self, duration_ms: float):
        self.metrics.increment("sssp_handshake_success")
        self.metrics.record_latency("sssp_handshake_duration", duration_ms)

    def record_handshake_failure(self, reason: str):
        self.metrics.increment(f"sssp_handshake_failure_{reason}")

    def record_replay_attempt(self):
        self.metrics.increment("sssp_replay_attempt_detected")

    def record_signature_failure(self):
        self.metrics.increment("sssp_signature_validation_failure")

    def record_reservation_failure(self):
        self.metrics.increment("sssp_reservation_failure")

    def record_session_created(self):
        self.metrics.increment("sssp_active_sessions_created")
