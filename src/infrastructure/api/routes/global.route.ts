import { Router } from "express";
import GlobalStatsRepositoryInterface from "../../../domain/global/repository/global-stats-repository.interface";
import DailyStatRepositoryInterface from "../../../domain/history/repository/daily-stat-repository.interface";
import FindGlobalHistoryUseCase from "../../../usecase/history/find-global/find.global-history.usecase";
import FindGlobalStatsUseCase from "../../../usecase/global/find/find.global-stats.usecase";

import { parseDays } from "./days-query";

export function globalRoute(
  globalStatsRepository: GlobalStatsRepositoryInterface,
  dailyStatRepository?: DailyStatRepositoryInterface,
): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await new FindGlobalStatsUseCase(globalStatsRepository).execute());
  });

  if (dailyStatRepository) {
    router.get("/history", async (req, res) => {
      const days = parseDays(req);
      res.json(await new FindGlobalHistoryUseCase(dailyStatRepository).execute({ days }));
    });
  }

  return router;
}
