export type OutputListCountryDto = {
  countries: {
    iso2: string;
    name: string;
    lat: number;
    lng: number;
    cases: number;
    deaths: number;
    recovered: number | null;
    active: number | null;
    todayCases: number;
    todayDeaths: number;
    casesPerMillion: number | null;
  }[];
};
