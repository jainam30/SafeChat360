class ProtocolError(Exception):
    pass

class InvalidStateTransitionError(ProtocolError):
    pass

class BundleValidationError(ProtocolError):
    pass

class ReplayAttackDetectedError(ProtocolError):
    pass

class PreKeyConsumedError(ProtocolError):
    pass

class HandshakeExpiredError(ProtocolError):
    pass

class SessionExistsError(ProtocolError):
    pass
