import GlobalStats from "../entity/global-stats";

export default interface GlobalStatsRepositoryInterface {
  save(stats: GlobalStats): Promise<void>;
  find(): Promise<GlobalStats | null>;
}
