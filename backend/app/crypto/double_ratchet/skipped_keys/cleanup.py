import logging
import threading
import time
from .interfaces import ISkippedKeyStore

logger = logging.getLogger(__name__)

class CleanupScheduler:
    """
    Background worker that periodically evicts expired skipped keys.
    """
    
    def __init__(self, store: ISkippedKeyStore, max_age_seconds: int = 604800, interval_seconds: int = 3600):
        self.store = store
        self.max_age_seconds = max_age_seconds
        self.interval_seconds = interval_seconds
        self._stop_event = threading.Event()
        self._thread = None

    def start(self):
        if self._thread is None:
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._run, daemon=True)
            self._thread.start()
            logger.info("CleanupScheduler started.")

    def stop(self):
        if self._thread:
            self._stop_event.set()
            self._thread.join()
            self._thread = None
            logger.info("CleanupScheduler stopped.")

    def _run(self):
        while not self._stop_event.is_set():
            try:
                self.store.cleanup_expired(self.max_age_seconds)
            except Exception as e:
                logger.error(f"CleanupScheduler encountered error: {e}")
                
            # Sleep in chunks to allow rapid shutdown
            for _ in range(self.interval_seconds):
                if self._stop_event.is_set():
                    break
                time.sleep(1)
