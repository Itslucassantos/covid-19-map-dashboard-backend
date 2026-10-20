import NotificationError from "../../@shared/notification/notification.error";
import CovidStats from "../../country/value-object/covid-stats";
import GlobalStats from "./global-stats";

describe("GlobalStats unit tests", () => {
  it("creates global stats", () => {
    const stats = new GlobalStats({ stats: CovidStats.empty(), affectedCountries: 200 });
    expect(stats.id).toBe("global");
    expect(stats.affectedCountries).toBe(200);
  });

  it("rejects negative affected countries", () => {
    expect(() => new GlobalStats({ stats: CovidStats.empty(), affectedCountries: -1 })).toThrow(
      NotificationError,
    );
  });
});
