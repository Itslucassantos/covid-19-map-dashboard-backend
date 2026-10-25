import request from "supertest";
import { Sequelize } from "sequelize-typescript";
import CountryFactory from "../../../domain/country/factory/country.factory";
import CovidStats from "../../../domain/country/value-object/covid-stats";
import GlobalStats from "../../../domain/global/entity/global-stats";
import CountryModel from "../../country/repository/sequelize/country.model";
import CountryRepository from "../../country/repository/sequelize/country.repository";
import DailyStat from "../../../domain/history/entity/daily-stat";
import DailyStatModel from "../../history/repository/sequelize/daily-stat.model";
import DailyStatRepository from "../../history/repository/sequelize/daily-stat.repository";
import GlobalStatsModel from "../../global/repository/sequelize/global-stats.model";
import GlobalStatsRepository from "../../global/repository/sequelize/global-stats.repository";
import { createApp } from "../express";

describe("E2E countries and global", () => {
  let sequelize: Sequelize;
  const countryRepository = new CountryRepository();
  const globalStatsRepository = new GlobalStatsRepository();
  const dailyStatRepository = new DailyStatRepository();
  const app = createApp({
    corsOrigin: "http://localhost:5173",
    countryRepository,
    globalStatsRepository,
    dailyStatRepository,
  });

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
    sequelize.addModels([CountryModel, GlobalStatsModel, DailyStatModel]);
    await sequelize.sync({ force: true });
    await countryRepository.create(
      CountryFactory.createWithTotals(
        {
          iso2: "BR",
          iso3: "BRA",
          name: "Brazil",
          lat: -14.23,
          lng: -51.92,
          population: 2_000_000,
        },
        {
          cases: 1000,
          deaths: 10,
          todayCases: 5,
          todayDeaths: 1,
          updatedAt: new Date("2026-10-17"),
        },
      ),
    );
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should list countries", async () => {
    const response = await request(app).get("/api/countries");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("public, max-age=300");
    expect(response.body.countries).toHaveLength(1);
    expect(response.body.countries[0]).toMatchObject({ iso2: "BR", name: "Brazil", cases: 1000 });
  });

  it("should find a country regardless of case", async () => {
    const response = await request(app).get("/api/countries/br");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      iso2: "BR",
      cases: 1000,
      recovered: null,
      casesPerMillion: 500,
      updatedAt: "2026-10-17T00:00:00.000Z",
    });
  });

  it("should return COUNTRY_NOT_FOUND", async () => {
    const response = await request(app).get("/api/countries/ZZ");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("COUNTRY_NOT_FOUND");
    expect(response.body.error.requestId).toBeDefined();
  });

  it("should return VALIDATION_ERROR for an invalid iso2", async () => {
    const response = await request(app).get("/api/countries/BRA");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return zeros for global stats before the first sync", async () => {
    const response = await request(app).get("/api/global");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ cases: 0, affectedCountries: 0, updatedAt: null });
  });

  it("should return global stats", async () => {
    await globalStatsRepository.save(
      new GlobalStats({
        affectedCountries: 1,
        stats: new CovidStats({ ...CovidStats.empty(), cases: 1000, deaths: 10 }),
      }),
    );

    const response = await request(app).get("/api/global");

    expect(response.body).toMatchObject({ cases: 1000, deaths: 10, affectedCountries: 1 });
  });

  describe("history", () => {
    beforeEach(async () => {
      const stat = (countryIso2: string | null, day: number) =>
        new DailyStat({
          countryIso2,
          date: `2026-01-0${day}`,
          cases: day * 10,
          deaths: day,
          newCases: 10,
          newDeaths: 1,
        });
      await dailyStatRepository.createMany([stat("BR", 1), stat("BR", 2), stat(null, 1)]);
    });

    it("should return the country history", async () => {
      const response = await request(app).get("/api/countries/br/history?days=1");

      expect(response.status).toBe(200);
      expect(response.body.iso2).toBe("BR");
      expect(response.body.history).toEqual([
        { date: "2026-01-02", cases: 20, deaths: 2, newCases: 10, newDeaths: 1 },
      ]);
    });

    it("should default days to 30", async () => {
      const response = await request(app).get("/api/countries/BR/history");

      expect(response.body.history).toHaveLength(2);
    });

    it("should return COUNTRY_NOT_FOUND for an unknown country", async () => {
      const response = await request(app).get("/api/countries/ZZ/history");

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("COUNTRY_NOT_FOUND");
    });

    it.each(["0", "366", "abc", "1.5", "-3"])("should reject days=%s", async (days) => {
      const response = await request(app).get(`/api/countries/BR/history?days=${days}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return the global history", async () => {
      const response = await request(app).get("/api/global/history?days=365");

      expect(response.status).toBe(200);
      expect(response.body.history).toHaveLength(1);
      expect(response.body.history[0].date).toBe("2026-01-01");
    });

    it("should validate days on the global history", async () => {
      const response = await request(app).get("/api/global/history?days=0");

      expect(response.status).toBe(400);
    });
  });
});
