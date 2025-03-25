import { NextResponse } from 'next/server';

/**
 * API endpoint that returns upcoming races for weather analysis
 * 
 * @returns Array of race objects with proper format
 */
export async function GET() {
  try {
    // Hardcoded race data with a full season of races and correct dates
    const races = [
      { 
        raceId: "australia-2025", 
        raceName: "Australian Grand Prix", 
        circuit: "Albert Park", 
        date: "2025-03-16" 
      },
      { 
        raceId: "china-2025", 
        raceName: "Chinese Grand Prix", 
        circuit: "Shanghai International Circuit", 
        date: "2025-03-23" 
      },
      { 
        raceId: "japan-2025", 
        raceName: "Japanese Grand Prix", 
        circuit: "Suzuka International Racing Course", 
        date: "2025-04-06" 
      },
      { 
        raceId: "bahrain-2025", 
        raceName: "Bahrain Grand Prix", 
        circuit: "Bahrain International Circuit", 
        date: "2025-04-13" 
      },
      { 
        raceId: "saudi-arabia-2025", 
        raceName: "Saudi Arabian Grand Prix", 
        circuit: "Jeddah Street Circuit", 
        date: "2025-04-20" 
      },
      { 
        raceId: "miami-2025", 
        raceName: "Miami Grand Prix", 
        circuit: "Miami International Autodrome", 
        date: "2025-05-04" 
      },
      { 
        raceId: "emilia-romagna-2025", 
        raceName: "Emilia Romagna Grand Prix", 
        circuit: "Autodromo Enzo e Dino Ferrari", 
        date: "2025-05-18" 
      },
      { 
        raceId: "monaco-2025", 
        raceName: "Monaco Grand Prix", 
        circuit: "Circuit de Monaco", 
        date: "2025-05-25" 
      },
      { 
        raceId: "spain-2025", 
        raceName: "Spanish Grand Prix", 
        circuit: "Circuit de Barcelona-Catalunya", 
        date: "2025-06-01" 
      },
      { 
        raceId: "canada-2025", 
        raceName: "Canadian Grand Prix", 
        circuit: "Circuit Gilles-Villeneuve", 
        date: "2025-06-15" 
      },
      { 
        raceId: "austria-2025", 
        raceName: "Austrian Grand Prix", 
        circuit: "Red Bull Ring", 
        date: "2025-06-29" 
      },
      { 
        raceId: "britain-2025", 
        raceName: "British Grand Prix", 
        circuit: "Silverstone Circuit", 
        date: "2025-07-06" 
      },
      { 
        raceId: "belgium-2025", 
        raceName: "Belgian Grand Prix", 
        circuit: "Circuit de Spa-Francorchamps", 
        date: "2025-07-27" 
      },
      { 
        raceId: "hungary-2025", 
        raceName: "Hungarian Grand Prix", 
        circuit: "Hungaroring", 
        date: "2025-08-03" 
      },
      { 
        raceId: "netherlands-2025", 
        raceName: "Dutch Grand Prix", 
        circuit: "Circuit Park Zandvoort", 
        date: "2025-08-31" 
      },
      { 
        raceId: "italy-2025", 
        raceName: "Italian Grand Prix", 
        circuit: "Autodromo Nazionale Monza", 
        date: "2025-09-07" 
      },
      { 
        raceId: "azerbaijan-2025", 
        raceName: "Azerbaijan Grand Prix", 
        circuit: "Baku City Circuit", 
        date: "2025-09-21" 
      },
      { 
        raceId: "singapore-2025", 
        raceName: "Singapore Grand Prix", 
        circuit: "Marina Bay Street Circuit", 
        date: "2025-10-05" 
      },
      { 
        raceId: "usa-2025", 
        raceName: "United States Grand Prix", 
        circuit: "Circuit of the Americas", 
        date: "2025-10-19" 
      },
      { 
        raceId: "mexico-2025", 
        raceName: "Mexico City Grand Prix", 
        circuit: "Autodromo Hermanos Rodriguez", 
        date: "2025-10-26" 
      },
      { 
        raceId: "sao-paulo-2025", 
        raceName: "São Paulo Grand Prix", 
        circuit: "Autodromo Jose Carlos Pace", 
        date: "2025-11-09" 
      },
      { 
        raceId: "las-vegas-2025", 
        raceName: "Las Vegas Grand Prix", 
        circuit: "Las Vegas Street Circuit", 
        date: "2025-11-23" 
      },
      { 
        raceId: "qatar-2025", 
        raceName: "Qatar Grand Prix", 
        circuit: "Losail International Circuit", 
        date: "2025-11-30" 
      },
      { 
        raceId: "abu-dhabi-2025", 
        raceName: "Abu Dhabi Grand Prix", 
        circuit: "Yas Marina Circuit", 
        date: "2025-12-07" 
      }
    ];
    
    return NextResponse.json(races);
  } catch (error) {
    console.error('Error fetching races for weather analysis:', error);
    return NextResponse.json({ error: 'Failed to fetch races' }, { status: 500 });
  }
} 