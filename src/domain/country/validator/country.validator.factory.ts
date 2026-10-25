import ValidatorInterface from "../../@shared/validator/validator.interface";
import Country from "../entity/country";
import CountryYupValidator from "./country.yup.validator";

export default class CountryValidatorFactory {
  static create(): ValidatorInterface<Country> {
    return new CountryYupValidator();
  }
}
