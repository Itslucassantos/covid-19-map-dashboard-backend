import Country, { CountryProps } from "../entity/country";
import CovidStats from "../value-object/covid-stats";

export default class CountryFactory {
  static create(props: CountryProps): Country {
    return new Country(props);
  }

  // Builds a country from cumulative totals, deriving the per-million figures from its population.
  static createWithTotals(
    props: Omit<CountryProps, "stats">,
    totals: {
      cases: number;
      deaths: number;
      todayCases: number;
      todayDeaths: number;
      updatedAt: Date;
    },
  ): Country {
    return new Country({
      ...props,
      stats: new CovidStats({
        ...totals,
        recovered: null,
        active: null,
        casesPerMillion: CovidStats.perMillion(totals.cases, props.population),
        deathsPerMillion: CovidStats.perMillion(totals.deaths, props.population),
      }),
    });
  }
}
