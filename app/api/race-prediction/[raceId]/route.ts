import { NextRequest, NextResponse } from 'next/server';
import { getRacePrediction } from '@/lib/services/racing-data-service';

interface RouteParams {
  params: {
    raceId: string;
  };
}

/**
 * API endpoint that returns race prediction data for a specific race
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const raceId = params.raceId;
  
  if (!raceId) {
    return NextResponse.json({ error: 'Race ID is required' }, { status: 400 });
  }
  
  try {
    // Optional refresh parameter for cache busting
    const refresh = request.nextUrl.searchParams.get('refresh');
    
    // Get race prediction from service
    const prediction = await getRacePrediction(raceId);
    
    if (!prediction) {
      return NextResponse.json({ error: 'Failed to generate race prediction' }, { status: 500 });
    }
    
    return NextResponse.json(prediction);
  } catch (error) {
    console.error(`Error generating prediction for race ${raceId}:`, error);
    return NextResponse.json({ error: 'Failed to generate race prediction' }, { status: 500 });
  }
}