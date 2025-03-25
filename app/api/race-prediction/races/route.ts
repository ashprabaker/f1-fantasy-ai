import { NextResponse } from 'next/server';
import { getUpcomingRaces } from '@/lib/services/racing-data-service';

/**
 * API endpoint that returns upcoming races for F1 season
 * 
 * @returns Array of race objects with id, name, circuit, and date fields
 */
export async function GET() {
  try {
    // Get upcoming races from service
    const races = await getUpcomingRaces();
    
    // If no races are found, return a placeholder set for development
    if (!races || races.length === 0) {
      // Fallback data for development
      const fallbackRaces = [
        { id: "australia", name: "Australian Grand Prix", circuit: "Albert Park", date: "2025-03-16" },
        { id: "china", name: "Chinese Grand Prix", circuit: "Shanghai International Circuit", date: "2025-03-23" },
        { id: "japan", name: "Japanese Grand Prix", circuit: "Suzuka International Racing Course", date: "2025-04-06" },
        { id: "bahrain", name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", date: "2025-04-13" },
        { id: "saudi-arabia", name: "Saudi Arabian Grand Prix", circuit: "Jeddah Street Circuit", date: "2025-04-20" },
        { id: "miami", name: "Miami Grand Prix", circuit: "Miami International Autodrome", date: "2025-05-04" }
      ];
      return NextResponse.json(fallbackRaces);
    }
    
    return NextResponse.json(races);
  } catch (error) {
    console.error('Error fetching upcoming races:', error);
    return NextResponse.json({ error: 'Failed to fetch upcoming races' }, { status: 500 });
  }
}