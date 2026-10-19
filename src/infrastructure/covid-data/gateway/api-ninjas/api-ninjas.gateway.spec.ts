import ApiNinjasGateway from "./api-ninjas.gateway";
import UpstreamUnavailableError from "../../../../domain/sync/gateway/upstream-unavailable.error";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function makeGateway(fetchFn: jest.Mock, overrides = {}) {
  const sleep = jest.fn().mockResolvedValue(undefined);
  const gateway = new ApiNinjasGateway({
    apiKey: "secret",
    fetchFn,
    sleep,
    retryDelayMs: 10,
    ...overrides,
  });
  return { gateway, sleep };
}

describe("ApiNinjasGateway unit tests", () => {
  it("should map the series, sorted by date, sending the api key and query", async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      jsonResponse([
        {
          country: "Canada",
          region: "Alberta",
          cases: { "2020-01-23": { total: 3, new: 2 }, "2020-01-22": { total: 1, new: 1 } },
        },
        { country: "Canada", region: "", cases: { "2020-01-22": { total: 5, new: 5 } } },
      ]),
    );
    const { gateway } = makeGateway(fetchFn);

    const series = await gateway.fetchSeries("Canada", "cases");

    expect(series).toEqual([
      {
        country: "Canada",
        region: "Alberta",
        points: [
          { date: "2020-01-22", total: 1, new: 1 },
          { date: "2020-01-23", total: 3, new: 2 },
        ],
      },
      { country: "Canada", region: null, points: [{ date: "2020-01-22", total: 5, new: 5 }] },
    ]);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toContain("country=Canada");
    expect(url).toContain("type=cases");
    expect(init.headers["X-Api-Key"]).toBe("secret");
  });

  it("should read the deaths key when the metric is deaths", async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      jsonResponse([
        {
          country: "United States",
          region: null,
          deaths: { "2020-03-01": { total: 1, new: 1 } },
        },
      ]),
    );
    const { gateway } = makeGateway(fetchFn);

    const [series] = await gateway.fetchSeries("US", "deaths");

    expect(series.points).toEqual([{ date: "2020-03-01", total: 1, new: 1 }]);
  });

  it("should return an empty list when the country is unknown", async () => {
    const { gateway } = makeGateway(jest.fn().mockResolvedValue(jsonResponse([])));

    expect(await gateway.fetchSeries("Nowhere", "cases")).toEqual([]);
  });

  it("should retry with backoff on 429 and then succeed", async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse([]));
    const { gateway, sleep } = makeGateway(fetchFn);

    await gateway.fetchSeries("Brazil", "cases");

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[10], [20]]);
  });

  it("should throw UpstreamUnavailableError when retries on 429 are exhausted", async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse({}, 429));
    const { gateway } = makeGateway(fetchFn, { maxRetries: 2 });

    await expect(gateway.fetchSeries("Brazil", "cases")).rejects.toThrow(UpstreamUnavailableError);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("should throw UpstreamUnavailableError on other http errors and network failures", async () => {
    const http = makeGateway(jest.fn().mockResolvedValue(jsonResponse({}, 500)));
    await expect(http.gateway.fetchSeries("Brazil", "cases")).rejects.toThrow("status 500");

    const network = makeGateway(jest.fn().mockRejectedValue(new Error("ECONNRESET")));
    await expect(network.gateway.fetchSeries("Brazil", "cases")).rejects.toThrow(
      UpstreamUnavailableError,
    );
  });
});
