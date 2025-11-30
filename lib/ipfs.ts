/**
 * IPFS utilities for file upload and download
 * Uses Pinata as the IPFS pinning service
 */

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

export interface IPFSMetadata {
    name: string;
    size: number;
    type: string;
    cid: string;
}

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadToIPFS(
    file: File | Blob,
    onProgress?: (progress: number) => void
): Promise<string> {
    if (!PINATA_JWT) {
        throw new Error('Pinata JWT not configured. Please set NEXT_PUBLIC_PINATA_JWT environment variable.');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Optional metadata
    const metadata = JSON.stringify({
        name: file instanceof File ? file.name : 'encrypted_data',
    });
    formData.append('pinataMetadata', metadata);

    // Pin options
    const options = JSON.stringify({
        cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    try {
        // Simulate progress for now (XMLHttpRequest would give real progress)
        if (onProgress) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (progress <= 90) {
                    onProgress(progress);
                }
            }, 200);

            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PINATA_JWT}`,
                },
                body: formData,
            });

            clearInterval(interval);
            onProgress(100);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload to IPFS');
            }

            const data = await response.json();
            return data.IpfsHash; // This is the CID
        } else {
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PINATA_JWT}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload to IPFS');
            }

            const data = await response.json();
            return data.IpfsHash;
        }
    } catch (error) {
        console.error('IPFS upload error:', error);
        throw error;
    }
}

/**
 * Download a file from IPFS via API route (avoids CORS issues)
 */
export async function downloadFromIPFS(cid: string): Promise<Blob> {
    // Use our API route to proxy the request and avoid CORS issues
    const response = await fetch(`/api/ipfs/${cid}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to download from IPFS: ${response.statusText}`);
    }

    return response.blob();
}

/**
 * Get file URL for IPFS CID
 */
export function getIPFSUrl(cid: string): string {
    return `${PINATA_GATEWAY}/ipfs/${cid}`;
}

/**
 * Check if a CID is pinned/available
 */
export async function checkIPFSAvailability(cid: string): Promise<boolean> {
    try {
        const response = await fetch(`${PINATA_GATEWAY}/ipfs/${cid}`, {
            method: 'HEAD',
        });
        return response.ok;
    } catch {
        return false;
    }
}

