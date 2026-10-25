import * as yup from "yup";
import ValidatorInterface from "../../@shared/validator/validator.interface";
import { validateWithYup } from "../../@shared/validator/yup-validation";
import DailyStat from "../entity/daily-stat";

const schema = yup.object({
  countryIso2: yup
    .string()
    .matches(/^[A-Z]{2}$/, "countryIso2 must be 2 uppercase letters")
    .nullable()
    .defined(),
  date: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
    .required(),
  cases: yup.number().integer().min(0).required(),
  deaths: yup.number().integer().min(0).required(),
  newCases: yup.number().integer().required(),
  newDeaths: yup.number().integer().required(),
});

export default class DailyStatYupValidator implements ValidatorInterface<DailyStat> {
  validate(entity: DailyStat): void {
    validateWithYup(entity, "daily-stat", schema, {
      countryIso2: entity.countryIso2,
      date: entity.date,
      cases: entity.cases,
      deaths: entity.deaths,
      newCases: entity.newCases,
      newDeaths: entity.newDeaths,
    });
  }
}
