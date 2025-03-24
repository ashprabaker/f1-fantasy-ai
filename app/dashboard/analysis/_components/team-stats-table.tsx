"use client"

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SeasonData {
  year: number
  points: number
  position: number
  wins: number
  podiums: number
}

interface TeamStatsTableProps {
  data: SeasonData[]
}

export default function TeamStatsTable({ data }: TeamStatsTableProps) {
  // Sort data by year in descending order
  const sortedData = [...data].sort((a, b) => b.year - a.year)
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>Constructor Championship Statistics</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Season</TableHead>
            <TableHead>Championship</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Wins</TableHead>
            <TableHead>Podiums</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No seasonal data available</TableCell>
            </TableRow>
          ) : (
            sortedData.map((season) => (
              <TableRow key={season.year}>
                <TableCell className="font-medium">{season.year}</TableCell>
                <TableCell>
                  {season.position}
                  <span className="text-xs text-muted-foreground ml-1">
                    {getOrdinal(season.position)}
                  </span>
                </TableCell>
                <TableCell>{season.points}</TableCell>
                <TableCell>{season.wins}</TableCell>
                <TableCell>{season.podiums}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}