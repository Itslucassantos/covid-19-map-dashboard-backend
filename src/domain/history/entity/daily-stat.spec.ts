import NotificationError from "../../@shared/notification/notification.error";
import DailyStat from "./daily-stat";

const valid = {
  countryIso2: "BR",
  date: "2023-03-09",
  cases: 10,
  deaths: 1,
  newCases: 2,
  newDeaths: 0,
};

describe("DailyStat unit tests", () => {
  it("builds the id from scope and date", () => {
    expect(new DailyStat(valid).id).toBe("BR:2023-03-09");
    expect(new DailyStat({ ...valid, countryIso2: null }).id).toBe("global:2023-03-09");
  });

  it("allows negative daily deltas but not negative totals", () => {
    expect(() => new DailyStat({ ...valid, newCases: -5 })).not.toThrow();
    expect(() => new DailyStat({ ...valid, cases: -1 })).toThrow(NotificationError);
  });

  it("rejects malformed dates", () => {
    expect(() => new DailyStat({ ...valid, date: "09/03/2023" })).toThrow(NotificationError);
  });
});
