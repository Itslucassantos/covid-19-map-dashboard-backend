import CovidDataGateway, {
  CovidMetric,
  CovidSeries,
} from "../../../../domain/sync/gateway/covid-data-gateway.interface";
import UpstreamUnavailableError from "../../../../domain/sync/gateway/upstream-unavailable.error";

type ApiNinjasItem = {
  country: string;
  region?: string | null;
} & Partial<Record<CovidMetric, Record<string, { total: number; new: number }>>>;

type Options = {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

export default class ApiNinjasGateway implements CovidDataGateway {
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly options: Options) {
    this.baseUrl = options.baseUrl ?? "https://api.api-ninjas.com/v1/covid19";
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 2000;
    this.fetchFn = options.fetchFn ?? fetch;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async fetchSeries(country: string, metric: CovidMetric): Promise<CovidSeries[]> {
    const url = `${this.baseUrl}?${new URLSearchParams({ country, type: metric })}`;
    const items = (await this.request(url)) as ApiNinjasItem[];
    return items.map((item) => ({
      country: item.country,
      region: item.region || null,
      points: Object.entries(item[metric] ?? {})
        .map(([date, value]) => ({ date, total: value.total, new: value.new }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  private async request(url: string): Promise<unknown> {
    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await this.fetchFn(url, { headers: { "X-Api-Key": this.options.apiKey } });
      } catch (error) {
        throw new UpstreamUnavailableError(
          `API Ninjas request failed: ${(error as Error).message}`,
        );
      }

      if (response.status === 429 && attempt < this.maxRetries) {
        await this.sleep(this.retryDelayMs * 2 ** attempt);
        continue;
      }
      if (!response.ok) {
        throw new UpstreamUnavailableError(`API Ninjas responded with status ${response.status}`);
      }
      return response.json();
    }
  }
}
