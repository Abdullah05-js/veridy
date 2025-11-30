import { NextRequest, NextResponse } from "next/server";

// List of public IPFS gateways to try
const IPFS_GATEWAYS = [
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud',
    'https://cloudflare-ipfs.com',
    'https://ipfs.io',
    'https://dweb.link',
    'https://w3s.link',
];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cid: string }> }
) {
    const { cid } = await params;

    if (!cid) {
        return NextResponse.json({ error: "CID is required" }, { status: 400 });
    }

    let lastError: Error | null = null;

    // Try each gateway until one works
    for (const gateway of IPFS_GATEWAYS) {
        try {
            const url = `${gateway}/ipfs/${cid}`;

            const response = await fetch(url, {
                headers: {
                    // Add Pinata JWT if available for their gateway
                    ...(gateway.includes('pinata') && process.env.PINATA_JWT
                        ? { Authorization: `Bearer ${process.env.PINATA_JWT}` }
                        : {}),
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();

                return new NextResponse(arrayBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                        'Content-Length': arrayBuffer.byteLength.toString(),
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                });
            }

            lastError = new Error(`Gateway ${gateway} returned ${response.status}`);
        } catch (error) {
            lastError = error as Error;
            console.error(`Failed to fetch from ${gateway}:`, error);
            // Continue to next gateway
        }
    }

    console.error("All IPFS gateways failed:", lastError);
    return NextResponse.json(
        { error: "Failed to fetch from IPFS", details: lastError?.message },
        { status: 502 }
    );
}

