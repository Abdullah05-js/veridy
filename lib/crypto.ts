/**
 * Cryptographic utilities for ECDH key exchange and file encryption
 * Uses the Web Crypto API for browser compatibility
 */

import { ECDHKeyPair } from './types';

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Generate a new ECDH keypair for secure key exchange
 */
export async function generateECDHKeyPair(): Promise<ECDHKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveBits']
    );

    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
        publicKey: bufferToHex(publicKeyRaw),
        privateKey: bufferToHex(privateKeyRaw),
    };
}

/**
 * Import a public key from hex for ECDH
 */
async function importPublicKey(publicKeyHex: string): Promise<CryptoKey> {
    const publicKeyBuffer = hexToBuffer(publicKeyHex);
    return crypto.subtle.importKey(
        'raw',
        publicKeyBuffer,
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        []
    );
}

/**
 * Import a private key from hex for ECDH
 */
async function importPrivateKey(privateKeyHex: string): Promise<CryptoKey> {
    const privateKeyBuffer = hexToBuffer(privateKeyHex);
    return crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveBits']
    );
}

/**
 * Compute ECDH shared secret between private key and other party's public key
 */
export async function computeSharedSecret(
    privateKeyHex: string,
    otherPublicKeyHex: string
): Promise<Uint8Array> {
    const privateKey = await importPrivateKey(privateKeyHex);
    const otherPublicKey = await importPublicKey(otherPublicKeyHex);

    const sharedSecretBits = await crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            public: otherPublicKey,
        },
        privateKey,
        256 // 32 bytes
    );

    return new Uint8Array(sharedSecretBits);
}

/**
 * Generate a random symmetric key for file encryption
 */
export async function generateSymmetricKey(): Promise<Uint8Array> {
    return crypto.getRandomValues(new Uint8Array(32)); // 256 bits
}

/**
 * XOR two byte arrays of equal length
 */
export function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    if (a.length !== b.length) {
        throw new Error('Arrays must be the same length for XOR');
    }
    const result = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}

/**
 * Encrypt the symmetric key K using ECDH
 * encK = sharedSecret XOR K
 */
export async function encryptSymmetricKey(
    symmetricKey: Uint8Array,
    sellerPrivateKeyHex: string,
    buyerPublicKeyHex: string
): Promise<string> {
    const sharedSecret = await computeSharedSecret(sellerPrivateKeyHex, buyerPublicKeyHex);
    const encK = xorBytes(sharedSecret, symmetricKey);
    return bufferToHex(encK);
}

/**
 * Decrypt the symmetric key K using ECDH
 * K = sharedSecret XOR encK
 */
export async function decryptSymmetricKey(
    encKHex: string,
    buyerPrivateKeyHex: string,
    sellerPublicKeyHex: string
): Promise<Uint8Array> {
    const sharedSecret = await computeSharedSecret(buyerPrivateKeyHex, sellerPublicKeyHex);
    const encK = hexToBuffer(encKHex);
    return xorBytes(sharedSecret, new Uint8Array(encK));
}

/**
 * Import a raw symmetric key for AES-GCM
 */
async function importSymmetricKey(keyBytes: Uint8Array): Promise<CryptoKey> {
    // Create a new ArrayBuffer to ensure proper type
    const buffer = new ArrayBuffer(keyBytes.length);
    new Uint8Array(buffer).set(keyBytes);

    return crypto.subtle.importKey(
        'raw',
        buffer,
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a file with AES-GCM
 * Returns: IV (12 bytes) + ciphertext
 */
export async function encryptFile(
    file: File | Blob,
    symmetricKey: Uint8Array
): Promise<Blob> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await importSymmetricKey(symmetricKey);
    const fileBuffer = await file.arrayBuffer();

    const ciphertext = await crypto.subtle.encrypt(
        {
            name: ALGORITHM,
            iv,
        },
        key,
        fileBuffer
    );

    // Prepend IV to ciphertext
    const result = new Uint8Array(iv.length + ciphertext.byteLength);
    result.set(iv);
    result.set(new Uint8Array(ciphertext), iv.length);

    return new Blob([result], { type: 'application/octet-stream' });
}

/**
 * Decrypt an encrypted file with AES-GCM
 * Input: IV (12 bytes) + ciphertext
 */
export async function decryptFile(
    encryptedBlob: Blob,
    symmetricKey: Uint8Array,
    originalType?: string
): Promise<Blob> {
    const encryptedBuffer = await encryptedBlob.arrayBuffer();
    const encryptedArray = new Uint8Array(encryptedBuffer);

    // Extract IV and ciphertext
    const iv = encryptedArray.slice(0, IV_LENGTH);
    const ciphertext = encryptedArray.slice(IV_LENGTH);

    const key = await importSymmetricKey(symmetricKey);

    const decrypted = await crypto.subtle.decrypt(
        {
            name: ALGORITHM,
            iv,
        },
        key,
        ciphertext
    );

    return new Blob([decrypted], { type: originalType || 'application/octet-stream' });
}

/**
 * Compute SHA-256 hash of a file
 */
export async function hashFile(file: File | Blob): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return bufferToHex(hashBuffer);
}

/**
 * Convert ArrayBuffer/Uint8Array to hex string
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Convert hex string to ArrayBuffer
 */
export function hexToBuffer(hex: string): ArrayBuffer {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes.buffer;
}

/**
 * Convert hex to bytes32 format (padded to 32 bytes, with 0x prefix)
 */
export function toBytes32(hex: string): `0x${string}` {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const padded = cleanHex.padStart(64, '0');
    return `0x${padded}` as `0x${string}`;
}

/**
 * Store symmetric key securely (localStorage with warning)
 * In production, consider more secure storage options
 */
export function storeSymmetricKey(listingId: string, key: Uint8Array): void {
    const keyHex = bufferToHex(key);
    const storage = localStorage.getItem('veridy_symmetric_keys');
    const keys = storage ? JSON.parse(storage) : {};
    keys[listingId] = keyHex;
    localStorage.setItem('veridy_symmetric_keys', JSON.stringify(keys));
}

/**
 * Retrieve stored symmetric key
 */
export function getStoredSymmetricKey(listingId: string): Uint8Array | null {
    const storage = localStorage.getItem('veridy_symmetric_keys');
    if (!storage) return null;
    const keys = JSON.parse(storage);
    const keyHex = keys[listingId];
    if (!keyHex) return null;
    return new Uint8Array(hexToBuffer(keyHex));
}

