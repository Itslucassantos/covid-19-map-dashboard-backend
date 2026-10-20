import Entity from "../../@shared/entity/entity.abstract";
import NotificationError from "../../@shared/notification/notification.error";
import CountryValidatorFactory from "../validator/country.validator.factory";
import CovidStats from "../value-object/covid-stats";

export type CountryProps = {
  iso2: string;
  iso3: string;
  name: string;
  lat: number;
  lng: number;
  population: number | null;
  stats?: CovidStats;
};

export default class Country extends Entity {
  private _iso3: string;
  private _name: string;
  private _lat: number;
  private _lng: number;
  private _population: number | null;
  private _stats: CovidStats;

  constructor(props: CountryProps) {
    super();
    this._id = props.iso2;
    this._iso3 = props.iso3;
    this._name = props.name;
    this._lat = props.lat;
    this._lng = props.lng;
    this._population = props.population;
    this._stats = props.stats ?? CovidStats.empty();
    this.validate();
  }

  get iso2(): string {
    return this._id;
  }

  get iso3(): string {
    return this._iso3;
  }

  get name(): string {
    return this._name;
  }

  get lat(): number {
    return this._lat;
  }

  get lng(): number {
    return this._lng;
  }

  get population(): number | null {
    return this._population;
  }

  get stats(): CovidStats {
    return this._stats;
  }

  changeStats(stats: CovidStats) {
    this._stats = stats;
    this.validate();
  }

  validate() {
    CountryValidatorFactory.create().validate(this);
    if (this.notification.hasErrors()) {
      throw new NotificationError(this.notification.getErrors());
    }
  }
}
