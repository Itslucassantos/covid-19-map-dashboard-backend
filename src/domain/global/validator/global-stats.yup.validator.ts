import * as yup from "yup";
import ValidatorInterface from "../../@shared/validator/validator.interface";
import { validateWithYup } from "../../@shared/validator/yup-validation";
import GlobalStats from "../entity/global-stats";

const count = yup.number().integer().min(0).required();

const schema = yup.object({
  affectedCountries: count,
  stats: yup.object({
    cases: count,
    deaths: count,
    todayCases: yup.number().integer().required(),
    todayDeaths: yup.number().integer().required(),
  }),
});

export default class GlobalStatsYupValidator implements ValidatorInterface<GlobalStats> {
  validate(entity: GlobalStats): void {
    validateWithYup(entity, "global-stats", schema, {
      affectedCountries: entity.affectedCountries,
      stats: entity.stats,
    });
  }
}
