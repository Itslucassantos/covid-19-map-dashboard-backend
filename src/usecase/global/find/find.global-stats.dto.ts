export type OutputFindGlobalStatsDto = {
  cases: number;
  deaths: number;
  recovered: number | null;
  active: number | null;
  todayCases: number;
  todayDeaths: number;
  affectedCountries: number;
  updatedAt: Date | null;
};
