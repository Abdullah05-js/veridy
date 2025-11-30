import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const address = searchParams.get("address");
  const chain = searchParams.get("chain") ?? "arbitrum";   // default
  const token = searchParams.get("token") ?? "usdt";      // default

  if (!address) {
    return NextResponse.json(
      { error: "Address is required" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      `https://wdk-api.tether.io/api/v1/${chain}/${token}/${address}/token-transfers`,
      {
        headers: {
          "x-api-key": process.env.INDEXER_API_KEY!,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
