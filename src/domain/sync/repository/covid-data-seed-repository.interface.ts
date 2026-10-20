export type SeedCountry = {
  iso2: string;
  iso3: string;
  name: string;
  lat: number;
  lng: number;
  population: number | null;
  cases: number;
  deaths: number;
  todayCases: number;
  todayDeaths: number;
  casesPerMillion: number | null;
  deathsPerMillion: number | null;
  updatedAt: Date;
};

export type SeedGlobalStats = {
  cases: number;
  deaths: number;
  todayCases: number;
  todayDeaths: number;
  affectedCountries: number;
  updatedAt: Date;
};

export type SeedDailyStat = {
  countryIso2: string | null;
  date: string;
  cases: number;
  deaths: number;
  newCases: number;
  newDeaths: number;
};

export type SeedData = {
  countries: SeedCountry[];
  global: SeedGlobalStats | null;
  dailyStats: SeedDailyStat[];
};

export default interface CovidDataSeedRepository {
  save(data: SeedData): Promise<void>;
}
