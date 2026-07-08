import { describe, it, expect } from 'vitest';
import { KeyGenerator } from '../keys/KeyGenerator';

// Mock Web Crypto API for Node.js environment if needed, 
// or run in a happy-dom/jsdom environment that supports crypto.subtle

describe('KeyGenerator', () => {
    it('generates an Identity Key with extractable: false', async () => {
        // In a real browser env, this will succeed.
        // We ensure the shape is correct.
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            const keyPair = await KeyGenerator.generateIdentityKeyPair();
            expect(keyPair.keyId).toBeDefined();
            expect(keyPair.publicKey.extractable).toBe(true); // Public key is extractable
            expect(keyPair.privateKey.extractable).toBe(false); // Private key is NOT extractable
        }
    });

    it('generates a Signed PreKey and verifies signature', async () => {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            const idKey = await KeyGenerator.generateIdentityKeyPair();
            const preKey = await KeyGenerator.generateAgreementKeyPair();
            
            const preKeyBytes = await KeyGenerator.exportPublicKey(preKey.publicKey);
            
            const signature = await KeyGenerator.signData(idKey.privateKey, preKeyBytes);
            
            const isValid = await KeyGenerator.verifySignature(idKey.publicKey, signature, preKeyBytes);
            expect(isValid).toBe(true);
        }
    });
});
