import DailyStat from "../../domain/history/entity/daily-stat";
import { HistoryPointDto } from "./history.dto";

export function toHistoryPoint(stat: DailyStat): HistoryPointDto {
  return {
    date: stat.date,
    cases: stat.cases,
    deaths: stat.deaths,
    newCases: stat.newCases,
    newDeaths: stat.newDeaths,
  };
}
