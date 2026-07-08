export type TrustState = 'UNVERIFIED' | 'VERIFIED' | 'COMPROMISED';

export interface IdentityRecord {
    userId: string;
    deviceId: string;
    publicKeyBytesB64: string;
    trustState: TrustState;
    verifiedAt?: number;
}

export class VerificationEngine {
    // In memory mock, would normally be stored in IndexedDB next to messages
    private identities: Map<string, IdentityRecord> = new Map();

    registerContactIdentity(userId: string, deviceId: string, publicKeyBytesB64: string) {
        const key = `${userId}:${deviceId}`;
        if (!this.identities.has(key)) {
            this.identities.set(key, {
                userId,
                deviceId,
                publicKeyBytesB64,
                trustState: 'UNVERIFIED'
            });
        }
    }

    markVerified(userId: string, deviceId: string) {
        const key = `${userId}:${deviceId}`;
        const record = this.identities.get(key);
        if (record) {
            record.trustState = 'VERIFIED';
            record.verifiedAt = Date.now();
            this.identities.set(key, record);
        }
    }

    markCompromised(userId: string, deviceId: string) {
        const key = `${userId}:${deviceId}`;
        const record = this.identities.get(key);
        if (record) {
            record.trustState = 'COMPROMISED';
            this.identities.set(key, record);
        }
    }

    getTrustState(userId: string, deviceId: string): TrustState {
        const key = `${userId}:${deviceId}`;
        return this.identities.get(key)?.trustState || 'UNVERIFIED';
    }
}
