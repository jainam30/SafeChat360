// Web Crypto API uses ECDH with P-256/P-384/P-521 or X25519 (in newer browsers).
// We will use ECDSA with P-256 for Identity Signatures, and ECDH with P-256 for Key Agreement,
// as they have the widest cross-browser support via native window.crypto.subtle.

export interface KeyPairInfo {
    keyId: string;
    publicKey: CryptoKey;
    privateKey: CryptoKey;
    publicBytes?: ArrayBuffer;
}

export class KeyGenerator {
    
    // Identity Key (ECDSA P-256) - Used for signing PreKeys
    static async generateIdentityKeyPair(): Promise<KeyPairInfo> {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            false, // private key is NOT extractable
            ["sign", "verify"]
        );
        
        return {
            keyId: crypto.randomUUID(),
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey
        };
    }

    // PreKey / One-Time PreKey (ECDH P-256) - Used for Key Agreement
    static async generateAgreementKeyPair(): Promise<KeyPairInfo> {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256"
            },
            false, // private key is NOT extractable
            ["deriveKey", "deriveBits"]
        );

        return {
            keyId: crypto.randomUUID(),
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey
        };
    }

    // Utility to sign a public key buffer with the Identity Private Key
    static async signData(privateKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return await window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" }
            },
            privateKey,
            data
        );
    }
    
    static async verifySignature(publicKey: CryptoKey, signature: ArrayBuffer, data: ArrayBuffer): Promise<boolean> {
        return await window.crypto.subtle.verify(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" }
            },
            publicKey,
            signature,
            data
        );
    }

    static async exportPublicKey(key: CryptoKey): Promise<ArrayBuffer> {
        return await window.crypto.subtle.exportKey("spki", key);
    }
    
    static async importPublicKey(keyData: ArrayBuffer, type: "ECDSA" | "ECDH"): Promise<CryptoKey> {
        return await window.crypto.subtle.importKey(
            "spki",
            keyData,
            {
                name: type,
                namedCurve: "P-256"
            },
            true,
            type === "ECDSA" ? ["verify"] : []
        );
    }
}
