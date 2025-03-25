import { NextResponse } from 'next/server';

interface WeatherForecastDay {
  day: string;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Partly Cloudy';
  temperature: number;
  tempLow: number;
  tempHigh: number;
  precipitation: number;
  precipProbability: number;
  windSpeed: number;
  humidity: number;
}

interface WeatherData {
  forecast: WeatherForecastDay[];
  impact: {
    temperature?: {
      impact: string;
      details: string;
    };
    precipitation?: {
      impact: string;
      details: string;
    };
    wind?: {
      impact: string;
      details: string;
    };
    strategy: {
      recommendation?: string;
      details?: string;
      tires: string | string[];
      pitStops: string | string[];
      carSetup: string | string[];
      keyConsiderations: string[];
    };
    teams: Record<string, number>;
    factors: {
      name: string;
      level: string;
      favors: string;
    }[];
  };
  historical: {
    year: number;
    condition: string;
    temperature: number;
    winner: string;
    notes: string;
    raceWeather: string;
    raceTemp: number;
    qualifyingWeather: string;
    qualifyingTemp: number;
    practiceWeather: string;
    practiceTemp: number;
  }[];
  driverWetPerformance: {
    driver: string;
    team: string;
    wetSkill?: number;
    isRookie: boolean;
    wetResults?: {
      position: number;
      race: string;
      year: number;
    }[];
    dryVsWet?: {
      condition: string;
      avgPosition: number;
    }[];
    wetVsDry: {
      condition: string;
      value: number;
    }[] | number;
    wetPerformance: {
      rating: number | string;
      strengths: string[];
      weaknesses?: string[];
      notable: string[];
      improvement: string[];
    };
    wetWins: number;
    rookieNote?: string;
    rating?: number | string;
  }[];
}

/**
 * API endpoint that returns weather analysis data for a specific race
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const raceId = url.pathname.split('/').pop() || '';
  
  if (!raceId) {
    return NextResponse.json({ error: 'Race ID is required' }, { status: 400 });
  }
  
  try {
    const isWetRace = raceId.includes('miami') || raceId.includes('singapore') || raceId.includes('sao-paulo');
    
    // Mock weather data for each race
    const weatherData: WeatherData = {
      forecast: [
        {
          day: "Practice 1",
          condition: "Sunny",
          temperature: 23,
          tempLow: 20,
          tempHigh: 26,
          precipitation: 0,
          precipProbability: 5,
          windSpeed: 8,
          humidity: 40
        },
        {
          day: "Practice 2",
          condition: "Partly Cloudy",
          temperature: 24,
          tempLow: 21,
          tempHigh: 27,
          precipitation: 0,
          precipProbability: 15,
          windSpeed: 10,
          humidity: 45
        },
        {
          day: "Practice 3",
          condition: "Cloudy",
          temperature: 22,
          tempLow: 19,
          tempHigh: 25,
          precipitation: 0,
          precipProbability: 25,
          windSpeed: 12,
          humidity: 50
        },
        {
          day: "Qualifying",
          condition: "Partly Cloudy",
          temperature: 25,
          tempLow: 22,
          tempHigh: 28,
          precipitation: 0,
          precipProbability: 30,
          windSpeed: 14,
          humidity: 55
        },
        {
          day: "Race Day",
          condition: isWetRace ? "Rain" : "Sunny",
          temperature: 26,
          tempLow: 23,
          tempHigh: 29,
          precipitation: isWetRace ? 15 : 0,
          precipProbability: isWetRace ? 75 : 10,
          windSpeed: 9,
          humidity: 45
        }
      ],
      impact: {
        temperature: {
          impact: "Moderate tire degradation expected",
          details: "Teams should monitor wear on the medium compounds"
        },
        precipitation: isWetRace ? {
          impact: "Wet conditions likely during the race",
          details: "Teams should prepare for multiple tire strategies"
        } : {
          impact: "Dry conditions expected",
          details: "Standard tire strategies likely"
        },
        wind: {
          impact: "Light winds expected",
          details: "Minimal impact on aerodynamics"
        },
        strategy: {
          recommendation: isWetRace ? 
            "Prepare for wet weather contingency" : 
            "Focus on tire management in hot conditions",
          details: "Track temperature will be key factor for tire performance",
          tires: isWetRace ? 
            ["Wet tires for start", "Potential switch to intermediates", "Slicks if track dries"] : 
            ["Medium for start", "Hard for middle stint", "Soft for final push"],
          pitStops: isWetRace ? 
            ["Reactive strategy depending on conditions", "2-3 stops likely"] : 
            ["2 stop strategy expected", "Watch for undercut opportunities"],
          carSetup: ["Balanced downforce", "Focus on mechanical grip", "Moderate brake cooling"],
          keyConsiderations: isWetRace ? [
            "Safety car probability increases with rain", 
            "Teams with better wet setups have advantage",
            "Driver confidence in wet conditions will be crucial",
            "Potential visibility issues in spray"
          ] : [
            "Tire management will be critical", 
            "Track position important for strategy flexibility", 
            "DRS effectiveness in hot conditions", 
            "Fuel consumption higher in heat"
          ]
        },
        teams: {
          "Red Bull Racing": 90,
          "Ferrari": 85,
          "Mercedes": 82,
          "McLaren": 88,
          "Aston Martin": 75,
          "Alpine": 65,
          "Williams": 60,
          "RB": 55,
          "Haas F1 Team": 52,
          "Sauber": 45
        },
        factors: [
          {
            name: "Temperature",
            level: "Medium",
            favors: "Red Bull, Ferrari"
          },
          {
            name: "Precipitation",
            level: isWetRace ? "High" : "Low",
            favors: isWetRace ? "Mercedes, Red Bull" : "Ferrari, McLaren"
          },
          {
            name: "Wind",
            level: "Low",
            favors: "All teams equally"
          },
          {
            name: "Track Temperature",
            level: "Medium",
            favors: "Red Bull, McLaren"
          }
        ]
      },
      historical: [
        {
          year: 2024,
          condition: "Sunny",
          temperature: 26,
          winner: "Max Verstappen",
          notes: "Dominant performance from Red Bull",
          raceWeather: "Sunny",
          raceTemp: 28,
          qualifyingWeather: "Sunny",
          qualifyingTemp: 27,
          practiceWeather: "Partly Cloudy",
          practiceTemp: 25
        },
        {
          year: 2023,
          condition: "Cloudy",
          temperature: 24,
          winner: "Lewis Hamilton",
          notes: "Strategy masterclass by Mercedes",
          raceWeather: "Cloudy",
          raceTemp: 24,
          qualifyingWeather: "Partly Cloudy",
          qualifyingTemp: 25,
          practiceWeather: "Cloudy",
          practiceTemp: 23
        },
        {
          year: 2022,
          condition: "Rain",
          temperature: 20,
          winner: "Charles Leclerc",
          notes: "Chaotic race with multiple safety cars",
          raceWeather: "Rain",
          raceTemp: 18,
          qualifyingWeather: "Cloudy",
          qualifyingTemp: 22,
          practiceWeather: "Partly Cloudy",
          practiceTemp: 24
        },
        {
          year: 2021,
          condition: "Sunny",
          temperature: 27,
          winner: "Max Verstappen",
          notes: "Close battle with Hamilton throughout",
          raceWeather: "Sunny",
          raceTemp: 29,
          qualifyingWeather: "Sunny",
          qualifyingTemp: 28,
          practiceWeather: "Sunny",
          practiceTemp: 27
        },
        {
          year: 2020,
          condition: "Partly Cloudy",
          temperature: 25,
          winner: "Lewis Hamilton",
          notes: "Mercedes dominance on display",
          raceWeather: "Partly Cloudy",
          raceTemp: 26,
          qualifyingWeather: "Sunny",
          qualifyingTemp: 27,
          practiceWeather: "Cloudy",
          practiceTemp: 24
        }
      ],
      driverWetPerformance: [
        {
          driver: "Max Verstappen",
          team: "Red Bull Racing",
          wetSkill: 9.5,
          isRookie: false,
          wetVsDry: 2.3,
          wetPerformance: {
            rating: 9,
            strengths: ["Excellent car control in wet", "Aggressive but controlled approach", "Great tire management"],
            weaknesses: [],
            notable: ["Brazil 2022 masterclass", "Germany 2019 comeback drive"],
            improvement: ["Consistency in changeable conditions"]
          },
          wetWins: 5
        },
        {
          driver: "Sergio Perez",
          team: "Red Bull Racing",
          wetSkill: 7.5,
          isRookie: false,
          wetVsDry: -0.2,
          wetPerformance: {
            rating: 6,
            strengths: ["Tire management", "Careful approach"],
            weaknesses: ["Sometimes too cautious"],
            notable: ["Turkey 2020 podium"],
            improvement: ["Qualifying performance in wet", "Confidence in high-speed corners"]
          },
          wetWins: 1
        },
        {
          driver: "Lewis Hamilton",
          team: "Mercedes",
          wetSkill: 9.8,
          isRookie: false,
          wetVsDry: 3.1,
          wetPerformance: {
            rating: 10,
            strengths: ["Finding grip", "Adaptability", "Precise car control", "Mental fortitude"],
            weaknesses: [],
            notable: ["Britain 2008 masterclass", "Turkey 2020 championship win"],
            improvement: ["Nothing significant"]
          },
          wetWins: 11
        },
        {
          driver: "George Russell",
          team: "Mercedes",
          wetSkill: 8.0,
          isRookie: false,
          wetVsDry: 1.0,
          wetPerformance: {
            rating: 7,
            strengths: ["Calculated approach", "Consistent lap times"],
            weaknesses: ["Sometimes lacks last bit of pace"],
            notable: ["Belgium 2021 qualifying"],
            improvement: ["Aggression in overtaking"]
          },
          wetWins: 0
        },
        {
          driver: "Charles Leclerc",
          team: "Ferrari",
          wetSkill: 7.8,
          isRookie: false,
          wetVsDry: 0.8,
          wetPerformance: {
            rating: 7,
            strengths: ["Qualifying pace", "Quick adaptation"],
            weaknesses: ["Occasional errors under pressure"],
            notable: ["Germany 2019 strong performance until error"],
            improvement: ["Consistency through full race distance", "Risk management"]
          },
          wetWins: 1
        },
        {
          driver: "Lando Norris",
          team: "McLaren",
          wetSkill: 8.2,
          isRookie: false,
          wetVsDry: 1.2,
          wetPerformance: {
            rating: 8,
            strengths: ["Natural feel for grip", "Adaptability"],
            weaknesses: ["Decision making under pressure"],
            notable: ["Russia 2021 leading until tire gamble"],
            improvement: ["Strategy calls", "Experience in leading positions"]
          },
          wetWins: 0
        },
        {
          driver: "Franco Colapinto",
          team: "Williams",
          isRookie: true,
          wetVsDry: 0,
          wetPerformance: {
            rating: "N/A",
            strengths: ["Promising F2 wet weather performances"],
            weaknesses: [],
            notable: [],
            improvement: ["Needs F1 experience in wet conditions"]
          },
          wetWins: 0,
          rookieNote: "Limited F1 wet weather data"
        }
      ]
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather analysis data:', error);
    return NextResponse.json({ error: 'Failed to fetch weather analysis data' }, { status: 500 });
  }
}