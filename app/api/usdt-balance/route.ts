import { NextResponse } from "next/server";
import axios from "axios";


export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const chain = searchParams.get("chain") ?? "arbitrum";
    console.log("-----", address, chain);
    if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    try {
        const response = await axios.get(
            `https://wdk-api.tether.io/api/v1/${chain}/usdt/${address}/token-balances`,
            {
                headers: {
                    "x-api-key": process.env.INDEXER_API_KEY!,
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
