import { Router } from "express";
import CountryRepositoryInterface from "../../../domain/country/repository/country-repository.interface";
import FindCountryUseCase from "../../../usecase/country/find/find.country.usecase";
import ListCountryUseCase from "../../../usecase/country/list/list.country.usecase";
import DailyStatRepositoryInterface from "../../../domain/history/repository/daily-stat-repository.interface";
import FindCountryHistoryUseCase from "../../../usecase/history/find-country/find.country-history.usecase";
import { ValidationError } from "../middlewares/error-handler";
import { parseDays } from "./days-query";

const ISO2_PATTERN = /^[A-Za-z]{2}$/;

export function countryRoute(
  countryRepository: CountryRepositoryInterface,
  dailyStatRepository?: DailyStatRepositoryInterface,
): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await new ListCountryUseCase(countryRepository).execute());
  });

  router.get("/:iso2", async (req, res) => {
    const iso2 = req.params.iso2;
    if (!ISO2_PATTERN.test(iso2)) {
      throw new ValidationError();
    }
    res.json(await new FindCountryUseCase(countryRepository).execute({ iso2 }));
  });

  if (dailyStatRepository) {
    router.get("/:iso2/history", async (req, res) => {
      const iso2 = req.params.iso2;
      if (!ISO2_PATTERN.test(iso2)) {
        throw new ValidationError();
      }
      const days = parseDays(req);
      res.json(
        await new FindCountryHistoryUseCase(countryRepository, dailyStatRepository).execute({
          iso2,
          days,
        }),
      );
    });
  }

  return router;
}
