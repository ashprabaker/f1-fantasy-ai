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
      // Fallback data for development - full season with correct dates
      const fallbackRaces = [
        { id: "australia", name: "Australian Grand Prix", circuit: "Albert Park", date: "2025-03-16" },
        { id: "china", name: "Chinese Grand Prix", circuit: "Shanghai International Circuit", date: "2025-03-23" },
        { id: "japan", name: "Japanese Grand Prix", circuit: "Suzuka International Racing Course", date: "2025-04-06" },
        { id: "bahrain", name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", date: "2025-04-13" },
        { id: "saudi-arabia", name: "Saudi Arabian Grand Prix", circuit: "Jeddah Street Circuit", date: "2025-04-20" },
        { id: "miami", name: "Miami Grand Prix", circuit: "Miami International Autodrome", date: "2025-05-04" },
        { id: "emilia-romagna", name: "Emilia Romagna Grand Prix", circuit: "Autodromo Enzo e Dino Ferrari", date: "2025-05-18" },
        { id: "monaco", name: "Monaco Grand Prix", circuit: "Circuit de Monaco", date: "2025-05-25" },
        { id: "spain", name: "Spanish Grand Prix", circuit: "Circuit de Barcelona-Catalunya", date: "2025-06-01" },
        { id: "canada", name: "Canadian Grand Prix", circuit: "Circuit Gilles-Villeneuve", date: "2025-06-15" },
        { id: "austria", name: "Austrian Grand Prix", circuit: "Red Bull Ring", date: "2025-06-29" },
        { id: "britain", name: "British Grand Prix", circuit: "Silverstone Circuit", date: "2025-07-06" },
        { id: "belgium", name: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", date: "2025-07-27" },
        { id: "hungary", name: "Hungarian Grand Prix", circuit: "Hungaroring", date: "2025-08-03" },
        { id: "netherlands", name: "Dutch Grand Prix", circuit: "Circuit Park Zandvoort", date: "2025-08-31" },
        { id: "italy", name: "Italian Grand Prix", circuit: "Autodromo Nazionale Monza", date: "2025-09-07" },
        { id: "azerbaijan", name: "Azerbaijan Grand Prix", circuit: "Baku City Circuit", date: "2025-09-21" },
        { id: "singapore", name: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", date: "2025-10-05" },
        { id: "usa", name: "United States Grand Prix", circuit: "Circuit of the Americas", date: "2025-10-19" },
        { id: "mexico", name: "Mexico City Grand Prix", circuit: "Autodromo Hermanos Rodriguez", date: "2025-10-26" },
        { id: "sao-paulo", name: "São Paulo Grand Prix", circuit: "Autodromo Jose Carlos Pace", date: "2025-11-09" },
        { id: "las-vegas", name: "Las Vegas Grand Prix", circuit: "Las Vegas Street Circuit", date: "2025-11-23" },
        { id: "qatar", name: "Qatar Grand Prix", circuit: "Losail International Circuit", date: "2025-11-30" },
        { id: "abu-dhabi", name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", date: "2025-12-07" }
      ];
      return NextResponse.json(fallbackRaces);
    }
    
    return NextResponse.json(races);
  } catch (error) {
    console.error('Error fetching upcoming races:', error);
    return NextResponse.json({ error: 'Failed to fetch upcoming races' }, { status: 500 });
  }
}