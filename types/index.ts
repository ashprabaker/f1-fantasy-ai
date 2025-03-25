export * from "./action-types" 

export interface Driver {
  driverId: string
  permanentNumber?: string
  code?: string
  url?: string
  givenName: string
  familyName: string
  dateOfBirth?: string
  nationality?: string
  constructor?: {
    constructorId: string
    name: string
    nationality: string
  }
}

export interface RaceResult {
  round: string;
  raceName: string;
  circuitName?: string;
  date: string;
  grid: number | string;
  position: number | string;
  points: number | string;
  status?: string;
  fastestLapRank?: string;
}

export interface DriverPerformance {
  driverInfo: {
    id: string;
    name: string;
    team: string;
    number: string;
    nationality: string;
  };
  // Alias for driverInfo to support legacy code
  driver: {
    id: string;
    name: string;
    team: string;
    number: string;
    nationality: string;
    permanentNumber: string;
  };
  stats: {
    championships: number;
    wins: number;
    podiums: number;
    points: number;
    polePositions: number;
    fastestLaps: number;
    totalPoints: number;
    bestFinish: number;
    averageFinishPosition: number;
    bestGrid: number;
  };
  seasonResults: RaceResult[];
  circuitPerformance: {
    [circuitId: string]: {
      avgPosition: number;
      bestPosition: number;
      appearances: number;
    };
  };
}