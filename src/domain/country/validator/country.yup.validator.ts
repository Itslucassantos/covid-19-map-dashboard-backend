import * as yup from "yup";
import ValidatorInterface from "../../@shared/validator/validator.interface";
import { validateWithYup } from "../../@shared/validator/yup-validation";
import Country from "../entity/country";

const count = yup.number().integer().min(0).required();
const optionalCount = yup.number().integer().min(0).nullable().defined();
const optionalRatio = yup.number().min(0).nullable().defined();

const schema = yup.object({
  iso2: yup
    .string()
    .matches(/^[A-Z]{2}$/, "iso2 must be 2 uppercase letters")
    .required(),
  iso3: yup
    .string()
    .matches(/^[A-Z]{3}$/, "iso3 must be 3 uppercase letters")
    .required(),
  name: yup.string().trim().required("name is a required field"),
  lat: yup.number().min(-90).max(90).required(),
  lng: yup.number().min(-180).max(180).required(),
  population: optionalCount,
  stats: yup.object({
    cases: count,
    deaths: count,
    recovered: optionalCount,
    active: optionalCount,
    // Daily deltas may be negative when the source corrects earlier numbers.
    todayCases: yup.number().integer().required(),
    todayDeaths: yup.number().integer().required(),
    casesPerMillion: optionalRatio,
    deathsPerMillion: optionalRatio,
  }),
});

export default class CountryYupValidator implements ValidatorInterface<Country> {
  validate(entity: Country): void {
    validateWithYup(entity, "country", schema, {
      iso2: entity.iso2,
      iso3: entity.iso3,
      name: entity.name,
      lat: entity.lat,
      lng: entity.lng,
      population: entity.population,
      stats: entity.stats,
    });
  }
}
