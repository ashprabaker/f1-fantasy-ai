import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }
  
  try {
    // Connect to database directly
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Check if user has an active subscription
    const subscriptions = await sql`
      SELECT * FROM subscriptions WHERE user_id = ${userId}
    `;
    
    // Check if the user has an active subscription
    const isPro = subscriptions.length > 0 && subscriptions[0].active === true;
    
    // For development, always return true
    const forceProInDev = process.env.NODE_ENV === "development";
    
    // Close the connection
    await sql.end();
    
    return NextResponse.json({ isPro: isPro || forceProInDev });
  } catch (error) {
    console.error("Error checking subscription:", error);
    
    // For development, allow access anyway
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ isPro: true });
    }
    
    return NextResponse.json({ error: "Failed to check subscription status" }, { status: 500 });
  }
} 