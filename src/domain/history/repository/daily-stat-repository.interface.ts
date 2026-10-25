import DailyStat from "../entity/daily-stat";

export default interface DailyStatRepositoryInterface {
  createMany(stats: DailyStat[]): Promise<void>;
  findLast(countryIso2: string | null, days: number): Promise<DailyStat[]>;
}
