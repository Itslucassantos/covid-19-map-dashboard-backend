export type InputFindCountryDto = {
  iso2: string;
};

export type OutputFindCountryDto = {
  iso2: string;
  iso3: string;
  name: string;
  lat: number;
  lng: number;
  population: number | null;
  cases: number;
  deaths: number;
  recovered: number | null;
  active: number | null;
  todayCases: number;
  todayDeaths: number;
  casesPerMillion: number | null;
  deathsPerMillion: number | null;
  updatedAt: Date | null;
};
