import { KeyGenerator } from '../keys/KeyGenerator';
import { SecureKeyStorage } from '../storage/SecureKeyStorage';

const storage = new SecureKeyStorage();

// Utility to convert ArrayBuffer to Base64 for transit
function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

self.onmessage = async (e: MessageEvent) => {
    const { action, payload, jobId } = e.data;

    try {
        if (action === 'GENERATE_IDENTITY') {
            const idKey = await KeyGenerator.generateIdentityKeyPair();
            const idKeyBytes = await KeyGenerator.exportPublicKey(idKey.publicKey);
            
            // Store private key securely
            await storage.storeKey(`identity_${idKey.keyId}`, idKey.privateKey);
            
            // Generate Signed PreKey
            const signedPreKey = await KeyGenerator.generateAgreementKeyPair();
            const preKeyBytes = await KeyGenerator.exportPublicKey(signedPreKey.publicKey);
            
            // Sign the PreKey with the Identity Key
            const signature = await KeyGenerator.signData(idKey.privateKey, preKeyBytes);
            
            // Store Signed PreKey Private
            await storage.storeKey(`signed_prekey_${signedPreKey.keyId}`, signedPreKey.privateKey);
            
            self.postMessage({
                jobId,
                status: 'success',
                data: {
                    identityKeyId: idKey.keyId,
                    identityPublicKeyB64: bufferToBase64(idKeyBytes),
                    signedPreKeyId: signedPreKey.keyId,
                    signedPreKeyPublicB64: bufferToBase64(preKeyBytes),
                    signatureB64: bufferToBase64(signature)
                }
            });
        } 
        else if (action === 'GENERATE_ONETIME_PREKEYS') {
            const count = payload.count || 50;
            const keys = [];
            
            for (let i = 0; i < count; i++) {
                const preKey = await KeyGenerator.generateAgreementKeyPair();
                const preKeyBytes = await KeyGenerator.exportPublicKey(preKey.publicKey);
                await storage.storeKey(`onetime_prekey_${preKey.keyId}`, preKey.privateKey);
                
                keys.push({
                    keyId: preKey.keyId,
                    publicBytesB64: bufferToBase64(preKeyBytes)
                });
            }
            
            self.postMessage({
                jobId,
                status: 'success',
                data: { keys }
            });
        }
    } catch (err: any) {
        self.postMessage({
            jobId,
            status: 'error',
            error: err.message
        });
    }
};
