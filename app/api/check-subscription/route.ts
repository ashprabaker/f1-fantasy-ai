import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }
  
  try {
    // Use direct SQL query to avoid ORM issues
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Check if user has an active subscription
    const result = await sql`SELECT * FROM subscriptions WHERE user_id = ${userId} LIMIT 1`;
    
    // Check if the user has an active subscription - handle case when active column doesn't exist
    const isPro = result.length > 0 ? 
      (result[0].active === undefined ? true : result[0].active === true) : 
      false;
    
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