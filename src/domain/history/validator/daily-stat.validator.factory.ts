import ValidatorInterface from "../../@shared/validator/validator.interface";
import DailyStat from "../entity/daily-stat";
import DailyStatYupValidator from "./daily-stat.yup.validator";

export default class DailyStatValidatorFactory {
  static create(): ValidatorInterface<DailyStat> {
    return new DailyStatYupValidator();
  }
}
