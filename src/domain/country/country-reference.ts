export type CountryReference = {
  iso2: string;
  iso3: string;
  name: string;
  lat: number;
  lng: number;
  population: number | null;
  aliases: string[];
};
