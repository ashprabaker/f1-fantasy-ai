import { NextRequest, NextResponse } from 'next/server';
import { getWeatherAnalysis } from '@/lib/services/racing-data-service';

interface RouteParams {
  params: {
    raceId: string;
  };
}

/**
 * API endpoint that returns weather analysis data for a specific race
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const raceId = params.raceId;
  
  if (!raceId) {
    return NextResponse.json({ error: 'Race ID is required' }, { status: 400 });
  }
  
  try {
    // Optional refresh parameter for cache busting
    const refresh = request.nextUrl.searchParams.get('refresh');
    
    // Get weather analysis from service
    const weatherData = await getWeatherAnalysis(raceId);
    
    if (!weatherData) {
      return NextResponse.json({ error: 'Failed to generate weather analysis' }, { status: 500 });
    }
    
    return NextResponse.json(weatherData);
  } catch (error) {
    console.error(`Error generating weather analysis for race ${raceId}:`, error);
    return NextResponse.json({ error: 'Failed to generate weather analysis' }, { status: 500 });
  }
}