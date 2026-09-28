from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime

class BaseEvent(BaseModel):
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor_id: Optional[int] = None
    payload: Dict[str, Any] = Field(default_factory=dict)

class UserRegisteredEvent(BaseEvent):
    event_type: str = "UserRegistered"

class UserLoggedInEvent(BaseEvent):
    event_type: str = "UserLoggedIn"

class PasswordChangedEvent(BaseEvent):
    event_type: str = "PasswordChanged"

class FriendRequestSentEvent(BaseEvent):
    event_type: str = "FriendRequestSent"

class FriendAcceptedEvent(BaseEvent):
    event_type: str = "FriendAccepted"

class GroupCreatedEvent(BaseEvent):
    event_type: str = "GroupCreated"

class MessageSentEvent(BaseEvent):
    event_type: str = "MessageSent"

# Alias: the message pipeline publishes MessageCreatedEvent when a message is persisted.
# Kept as a distinct class so handlers can subscribe to either name.
class MessageCreatedEvent(MessageSentEvent):
    event_type: str = "MessageCreated"

class StoryCreatedEvent(BaseEvent):
    event_type: str = "StoryCreated"

class NotificationCreatedEvent(BaseEvent):
    event_type: str = "NotificationCreated"

class FileUploadedEvent(BaseEvent):
    event_type: str = "FileUploaded"

class PresenceChangedEvent(BaseEvent):
    event_type: str = "PresenceChanged"

class TypingStartedEvent(BaseEvent):
    event_type: str = "TypingStarted"

class MessageDeliveredEvent(BaseEvent):
    event_type: str = "MessageDelivered"

class MessageReadEvent(BaseEvent):
    event_type: str = "MessageRead"

class MessageEditedEvent(BaseEvent):
    event_type: str = "MessageEdited"

class MessageDeletedEvent(BaseEvent):
    event_type: str = "MessageDeleted"

# Phase D: Security & Identity Events
class IdentityVerifiedEvent(BaseEvent):
    event_type: str = "IdentityVerified"

class DeviceRegisteredEvent(BaseEvent):
    event_type: str = "DeviceRegistered"

class DeviceRevokedEvent(BaseEvent):
    event_type: str = "DeviceRevoked"

class SessionCreatedEvent(BaseEvent):
    event_type: str = "SessionCreated"

class SessionRevokedEvent(BaseEvent):
    event_type: str = "SessionRevoked"

class RefreshRotatedEvent(BaseEvent):
    event_type: str = "RefreshRotated"

class SecurityAlertEvent(BaseEvent):
    event_type: str = "SecurityAlert"

# Phase E: Distributed Messaging Events
class ConnectionOpenedEvent(BaseEvent):
    event_type: str = "ConnectionOpened"

class ConnectionClosedEvent(BaseEvent):
    event_type: str = "ConnectionClosed"

class ConnectionRecoveredEvent(BaseEvent):
    event_type: str = "ConnectionRecovered"

class HeartbeatTimeoutEvent(BaseEvent):
    event_type: str = "HeartbeatTimeout"

class MessageQueuedEvent(BaseEvent):
    event_type: str = "MessageQueued"

class RetryScheduledEvent(BaseEvent):
    event_type: str = "RetryScheduled"

class RetryCompletedEvent(BaseEvent):
    event_type: str = "RetryCompleted"

class GatewayStartedEvent(BaseEvent):
    event_type: str = "GatewayStarted"

# Phase F3.1: Protocol Events
class ProtocolHandshakeStartedEvent(BaseEvent):
    event_type: str = "ProtocolHandshakeStarted"

class ProtocolHandshakeCompletedEvent(BaseEvent):
    event_type: str = "ProtocolHandshakeCompleted"

class ProtocolHandshakeFailedEvent(BaseEvent):
    event_type: str = "ProtocolHandshakeFailed"

class ProtocolChallengeGeneratedEvent(BaseEvent):
    event_type: str = "ProtocolChallengeGenerated"

class ProtocolChallengeVerifiedEvent(BaseEvent):
    event_type: str = "ProtocolChallengeVerified"

class ProtocolReplayAttackDetectedEvent(BaseEvent):
    event_type: str = "ProtocolReplayAttackDetected"

class ProtocolViolationDetectedEvent(BaseEvent):
    event_type: str = "ProtocolViolationDetected"

class ProtocolCapabilityNegotiatedEvent(BaseEvent):
    event_type: str = "ProtocolCapabilityNegotiated"

class ProtocolSessionEstablishedEvent(BaseEvent):
    event_type: str = "ProtocolSessionEstablished"

class ProtocolSessionDestroyedEvent(BaseEvent):
    event_type: str = "ProtocolSessionDestroyed"

# Phase F4.1: X3DH Prekey Events
class SignedPrekeyGeneratedEvent(BaseEvent):
    event_type: str = "SignedPrekeyGenerated"

class SignedPrekeyRotatedEvent(BaseEvent):
    event_type: str = "SignedPrekeyRotated"

class SignedPrekeyExpiredEvent(BaseEvent):
    event_type: str = "SignedPrekeyExpired"

class OneTimePrekeyGeneratedEvent(BaseEvent):
    event_type: str = "OneTimePrekeyGenerated"

class OneTimePrekeyConsumedEvent(BaseEvent):
    event_type: str = "OneTimePrekeyConsumed"

class BundleGeneratedEvent(BaseEvent):
    event_type: str = "BundleGenerated"

class BundlePublishedEvent(BaseEvent):
    event_type: str = "BundlePublished"

class BundleRetrievedEvent(BaseEvent):
    event_type: str = "BundleRetrieved"

class BundleExpiredEvent(BaseEvent):
    event_type: str = "BundleExpired"

class BundleValidationFailedEvent(BaseEvent):
    event_type: str = "BundleValidationFailed"

# Phase F4.2: X3DH Key Agreement Events
class KeyAgreementCompletedEvent(BaseEvent):
    event_type: str = "KeyAgreementCompleted"

class SharedSecretDerivedEvent(BaseEvent):
    event_type: str = "SharedSecretDerived"

class BootstrapFailedEvent(BaseEvent):
    event_type: str = "BootstrapFailed"

# Phase F5.1: Double Ratchet State Events
class DoubleRatchetInitializedEvent(BaseEvent):
    event_type: str = "DoubleRatchetInitialized"

class RootKeyCreatedEvent(BaseEvent):
    event_type: str = "RootKeyCreated"

class RatchetStateCreatedEvent(BaseEvent):
    event_type: str = "RatchetStateCreated"

class InitializationFailedEvent(BaseEvent):
    event_type: str = "InitializationFailed"

# Phase F5.2: Symmetric Ratchet Events
class MessageKeyDerivedEvent(BaseEvent):
    event_type: str = "MessageKeyDerived"

class ChainAdvancedEvent(BaseEvent):
    event_type: str = "ChainAdvanced"

class SymmetricRatchetAdvancedEvent(BaseEvent):
    event_type: str = "SymmetricRatchetAdvanced"

class RatchetFailureEvent(BaseEvent):
    event_type: str = "RatchetFailure"

# Phase F5.3: DH Ratchet Events
class DHRatchetStartedEvent(BaseEvent):
    event_type: str = "DHRatchetStarted"

class DHRatchetCompletedEvent(BaseEvent):
    event_type: str = "DHRatchetCompleted"

class RootKeyAdvancedEvent(BaseEvent):
    event_type: str = "RootKeyAdvanced"

class ChainKeysRegeneratedEvent(BaseEvent):
    event_type: str = "ChainKeysRegenerated"

class LocalDHKeyRotatedEvent(BaseEvent):
    event_type: str = "LocalDHKeyRotated"

class RemoteDHKeyAcceptedEvent(BaseEvent):
    event_type: str = "RemoteDHKeyAccepted"

class DHRatchetFailedEvent(BaseEvent):
    event_type: str = "DHRatchetFailed"

# Phase F5.4: Double Ratchet Header Events
class HeaderConstructedEvent(BaseEvent):
    event_type: str = "HeaderConstructed"

class HeaderValidatedEvent(BaseEvent):
    event_type: str = "HeaderValidated"

class HeaderRejectedEvent(BaseEvent):
    event_type: str = "HeaderRejected"

class HeaderParsedEvent(BaseEvent):
    event_type: str = "HeaderParsed"

class HeaderSerializationCompletedEvent(BaseEvent):
    event_type: str = "HeaderSerializationCompleted"

class HeaderDeserializationCompletedEvent(BaseEvent):
    event_type: str = "HeaderDeserializationCompleted"

# Phase F5.5: AEAD Encryption Events
class MessageEncryptionStartedEvent(BaseEvent):
    event_type: str = "MessageEncryptionStarted"

class AADGeneratedEvent(BaseEvent):
    event_type: str = "AADGenerated"

class NonceGeneratedEvent(BaseEvent):
    event_type: str = "NonceGenerated"

class PayloadEncryptedEvent(BaseEvent):
    event_type: str = "PayloadEncrypted"

class EncryptionSucceededEvent(BaseEvent):
    event_type: str = "EncryptionSucceeded"

class EncryptionFailedEvent(BaseEvent):
    event_type: str = "EncryptionFailed"

# Phase F5.6: AEAD Decryption Events
class MessageDecryptionStartedEvent(BaseEvent):
    event_type: str = "MessageDecryptionStarted"

class AuthenticationVerifiedEvent(BaseEvent):
    event_type: str = "AuthenticationVerified"

class PayloadDecryptedEvent(BaseEvent):
    event_type: str = "PayloadDecrypted"

class DecryptionSucceededEvent(BaseEvent):
    event_type: str = "DecryptionSucceeded"

class AuthenticationFailedEvent(BaseEvent):
    event_type: str = "AuthenticationFailed"

class DecryptionFailedEvent(BaseEvent):
    event_type: str = "DecryptionFailed"

# Phase F5.7: Skipped Message Key Events
class SkippedKeyStoredEvent(BaseEvent):
    event_type: str = "SkippedKeyStored"

class SkippedKeyConsumedEvent(BaseEvent):
    event_type: str = "SkippedKeyConsumed"

class SkippedKeyExpiredEvent(BaseEvent):
    event_type: str = "SkippedKeyExpired"

class SkippedKeyRejectedEvent(BaseEvent):
    event_type: str = "SkippedKeyRejected"

class ReplayDetectedEvent(BaseEvent):
    event_type: str = "ReplayDetected"

class GapDetectedEvent(BaseEvent):
    event_type: str = "GapDetected"

class GapResolvedEvent(BaseEvent):
    event_type: str = "GapResolved"

class CleanupCompletedEvent(BaseEvent):
    event_type: str = "CleanupCompleted"
