export type CovidMetric = "cases" | "deaths";

export type CovidDailyPoint = {
  date: string;
  total: number;
  new: number;
};

export type CovidSeries = {
  country: string;
  region: string | null;
  points: CovidDailyPoint[];
};

export default interface CovidDataGateway {
  fetchSeries(country: string, metric: CovidMetric): Promise<CovidSeries[]>;
}
