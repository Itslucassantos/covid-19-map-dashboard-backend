export type CovidStatsProps = {
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

export default class CovidStats {
  readonly cases: number;
  readonly deaths: number;
  readonly recovered: number | null;
  readonly active: number | null;
  readonly todayCases: number;
  readonly todayDeaths: number;
  readonly casesPerMillion: number | null;
  readonly deathsPerMillion: number | null;
  readonly updatedAt: Date | null;

  constructor(props: CovidStatsProps) {
    this.cases = props.cases;
    this.deaths = props.deaths;
    this.recovered = props.recovered;
    this.active = props.active;
    this.todayCases = props.todayCases;
    this.todayDeaths = props.todayDeaths;
    this.casesPerMillion = props.casesPerMillion;
    this.deathsPerMillion = props.deathsPerMillion;
    this.updatedAt = props.updatedAt;
  }

  static empty(): CovidStats {
    return new CovidStats({
      cases: 0,
      deaths: 0,
      recovered: null,
      active: null,
      todayCases: 0,
      todayDeaths: 0,
      casesPerMillion: null,
      deathsPerMillion: null,
      updatedAt: null,
    });
  }

  static perMillion(value: number, population: number | null): number | null {
    return population ? (value / population) * 1e6 : null;
  }
}
