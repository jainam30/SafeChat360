export class FingerprintGenerator {
    /**
     * Generates a stable numeric fingerprint from an Identity Public Key.
     * This mimics WhatsApp/Signal's safety numbers.
     */
    static async generateNumericFingerprint(publicKeyBytes: ArrayBuffer): Promise<string> {
        // Hash the public key bytes
        const hash = await window.crypto.subtle.digest("SHA-512", publicKeyBytes);
        const hashArray = new Uint8Array(hash);
        
        // Convert chunks of the hash to numbers to create a 60 digit string
        let fingerprint = "";
        for (let i = 0; i < hashArray.length && fingerprint.length < 60; i += 4) {
            // Take 4 bytes, convert to integer
            const chunk = (hashArray[i] << 24) | (hashArray[i+1] << 16) | (hashArray[i+2] << 8) | hashArray[i+3];
            // Get absolute value and pad to 5 digits
            fingerprint += Math.abs(chunk).toString().padStart(5, '0');
        }
        
        // Trim to exactly 60 digits and format with spaces every 5 digits for readability
        const raw60 = fingerprint.substring(0, 60);
        return raw60.match(/.{1,5}/g)?.join(' ') || raw60;
    }

    /**
     * Base64 representation of the public key, useful for QR Codes.
     */
    static generateQRCodePayload(userId: string, publicKeyBytes: ArrayBuffer): string {
        const bytes = new Uint8Array(publicKeyBytes);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        return `safechat360-v1:${userId}?pk=${b64}`;
    }
}
