import CountryNameResolver from "../../../domain/country/country-name-resolver";
import { CountryReference } from "../../../domain/country/country-reference";
import CovidDataSeedRepository, {
  SeedCountry,
  SeedDailyStat,
} from "../../../domain/sync/repository/covid-data-seed-repository.interface";
import CovidDataGateway, {
  CovidMetric,
  CovidSeries,
} from "../../../domain/sync/gateway/covid-data-gateway.interface";
import { OutputSeedCovidDataDto } from "./seed.covid-data.dto";

type Totals = Map<string, { total: number; new: number }>;

type Options = {
  countries: CountryReference[];
  extraAliases?: Record<string, string[]>;
  pauseMs?: number;
  sleep?: (ms: number) => Promise<void>;
  log?: (message: Record<string, unknown>) => void;
};

export default class SeedCovidDataUseCase {
  private readonly resolver: CountryNameResolver;
  private readonly pauseMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly log: (message: Record<string, unknown>) => void;

  constructor(
    private readonly gateway: CovidDataGateway,
    private readonly repository: CovidDataSeedRepository,
    private readonly options: Options,
  ) {
    this.resolver = new CountryNameResolver(options.countries, options.extraAliases);
    this.pauseMs = options.pauseMs ?? 1000;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.log = options.log ?? (() => undefined);
  }

  async execute(): Promise<OutputSeedCovidDataDto> {
    const countries: SeedCountry[] = [];
    const dailyStats: SeedDailyStat[] = [];
    const perCountry = new Map<string, Map<string, SeedDailyStat>>();
    const failedCountries: OutputSeedCovidDataDto["failedCountries"] = [];

    const total = this.options.countries.length;
    for (const [index, reference] of this.options.countries.entries()) {
      try {
        const [cases, deaths] = await Promise.all([
          this.fetchTotals(reference, "cases"),
          this.fetchTotals(reference, "deaths"),
        ]);
        const days = this.mergeDays(reference.iso2, cases, deaths);
        if (days.length === 0) {
          failedCountries.push({ iso2: reference.iso2, reason: "no data returned" });
        } else {
          perCountry.set(reference.iso2, new Map(days.map((day) => [day.date, day])));
          dailyStats.push(...days);
          countries.push(this.toSeedCountry(reference, days));
        }
      } catch (error) {
        failedCountries.push({ iso2: reference.iso2, reason: (error as Error).message });
      }
      this.log({
        msg: "country processed",
        iso2: reference.iso2,
        progress: `${index + 1}/${total}`,
      });
    }

    const globalDays = this.sumGlobal(perCountry);
    dailyStats.push(...globalDays);
    const last = globalDays.at(-1);

    await this.repository.save({
      countries,
      dailyStats,
      global: last
        ? {
            cases: last.cases,
            deaths: last.deaths,
            todayCases: last.newCases,
            todayDeaths: last.newDeaths,
            affectedCountries: countries.filter((country) => country.cases > 0).length,
            updatedAt: new Date(`${last.date}T00:00:00Z`),
          }
        : null,
    });

    return {
      countriesSeeded: countries.length,
      dailyStatsSeeded: dailyStats.length,
      failedCountries,
    };
  }

  // Queries by dataset name first, then by known aliases, until the source returns data.
  private async fetchTotals(reference: CountryReference, metric: CovidMetric): Promise<Totals> {
    const candidates = [reference.name, ...(this.options.extraAliases?.[reference.iso2] ?? [])];
    for (const candidate of candidates) {
      const series = await this.gateway.fetchSeries(candidate, metric);
      await this.sleep(this.pauseMs);
      const totals = this.sumRegions(reference.iso2, series);
      if (totals.size > 0) return totals;
    }
    return new Map();
  }

  // Countries with administrative divisions come back as one series per region: sum them by date.
  private sumRegions(iso2: string, series: CovidSeries[]): Totals {
    const totals: Totals = new Map();
    for (const item of series) {
      if (this.resolver.resolve(item.country)?.iso2 !== iso2) continue;
      for (const point of item.points) {
        const current = totals.get(point.date) ?? { total: 0, new: 0 };
        totals.set(point.date, {
          total: current.total + point.total,
          new: current.new + point.new,
        });
      }
    }
    return totals;
  }

  private mergeDays(iso2: string, cases: Totals, deaths: Totals): SeedDailyStat[] {
    const dates = [...new Set([...cases.keys(), ...deaths.keys()])].sort();
    let lastCases = 0;
    let lastDeaths = 0;
    return dates.map((date) => {
      lastCases = cases.get(date)?.total ?? lastCases;
      lastDeaths = deaths.get(date)?.total ?? lastDeaths;
      return {
        countryIso2: iso2,
        date,
        cases: lastCases,
        deaths: lastDeaths,
        newCases: cases.get(date)?.new ?? 0,
        newDeaths: deaths.get(date)?.new ?? 0,
      };
    });
  }

  private sumGlobal(perCountry: Map<string, Map<string, SeedDailyStat>>): SeedDailyStat[] {
    const dates = [...new Set([...perCountry.values()].flatMap((days) => [...days.keys()]))].sort();
    const lastSeen = new Map<string, SeedDailyStat>();
    return dates.map((date) => {
      const sum = { countryIso2: null, date, cases: 0, deaths: 0, newCases: 0, newDeaths: 0 };
      for (const [iso2, days] of perCountry) {
        const day = days.get(date);
        if (day) lastSeen.set(iso2, day);
        const current = lastSeen.get(iso2);
        if (!current) continue;
        sum.cases += current.cases;
        sum.deaths += current.deaths;
        if (day) {
          sum.newCases += day.newCases;
          sum.newDeaths += day.newDeaths;
        }
      }
      return sum;
    });
  }

  private toSeedCountry(reference: CountryReference, days: SeedDailyStat[]): SeedCountry {
    const last = days[days.length - 1];
    const perMillion = (value: number) =>
      reference.population ? (value / reference.population) * 1e6 : null;
    return {
      iso2: reference.iso2,
      iso3: reference.iso3,
      name: reference.name,
      lat: reference.lat,
      lng: reference.lng,
      population: reference.population,
      cases: last.cases,
      deaths: last.deaths,
      todayCases: last.newCases,
      todayDeaths: last.newDeaths,
      casesPerMillion: perMillion(last.cases),
      deathsPerMillion: perMillion(last.deaths),
      updatedAt: new Date(`${last.date}T00:00:00Z`),
    };
  }
}
