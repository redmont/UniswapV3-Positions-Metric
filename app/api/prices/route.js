import { NextResponse } from "next/server";
import {
  getCurrentPrice,
  getPriceAtTimestamp,
} from "../../../services/coingecko";

export async function POST(request) {
  try {
    const { tokenAddress, historicalDate } = await request.json();

    if (!tokenAddress) {
      return NextResponse.json(
        { error: "Token address is required" },
        { status: 400 }
      );
    }

    let priceData;

    if (historicalDate) {
      priceData = await getPriceAtTimestamp(tokenAddress, historicalDate);
    } else {
      priceData = await getCurrentPrice(tokenAddress); // Fetches against USD by default
    }

    return NextResponse.json({ price: priceData });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch price data" },
      { status: 500 }
    );
  }
}
