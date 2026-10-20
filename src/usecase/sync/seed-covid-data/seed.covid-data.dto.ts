export type OutputSeedCovidDataDto = {
  countriesSeeded: number;
  dailyStatsSeeded: number;
  failedCountries: { iso2: string; reason: string }[];
};
