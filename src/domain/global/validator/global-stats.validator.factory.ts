import ValidatorInterface from "../../@shared/validator/validator.interface";
import GlobalStats from "../entity/global-stats";
import GlobalStatsYupValidator from "./global-stats.yup.validator";

export default class GlobalStatsValidatorFactory {
  static create(): ValidatorInterface<GlobalStats> {
    return new GlobalStatsYupValidator();
  }
}
