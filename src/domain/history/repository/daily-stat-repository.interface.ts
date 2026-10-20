import DailyStat from "../entity/daily-stat";

export default interface DailyStatRepositoryInterface {
  createMany(stats: DailyStat[]): Promise<void>;
  // Most recent `days` entries in ascending date order; null countryIso2 means the global series.
  findLast(countryIso2: string | null, days: number): Promise<DailyStat[]>;
}
