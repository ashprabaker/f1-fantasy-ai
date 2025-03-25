import { NextResponse } from 'next/server';
import { getRacePrediction } from '@/lib/services/racing-data-service';

/**
 * API endpoint that returns race prediction data for a specific race
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const raceId = url.pathname.split('/').pop() || '';
  
  if (!raceId) {
    return NextResponse.json({ error: 'Race ID is required' }, { status: 400 });
  }
  
  try {
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