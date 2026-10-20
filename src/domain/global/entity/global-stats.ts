import Entity from "../../@shared/entity/entity.abstract";
import NotificationError from "../../@shared/notification/notification.error";
import CovidStats from "../../country/value-object/covid-stats";
import GlobalStatsValidatorFactory from "../validator/global-stats.validator.factory";

export type GlobalStatsProps = {
  stats: CovidStats;
  affectedCountries: number;
};

export default class GlobalStats extends Entity {
  private _stats: CovidStats;
  private _affectedCountries: number;

  constructor(props: GlobalStatsProps) {
    super();
    this._id = "global";
    this._stats = props.stats;
    this._affectedCountries = props.affectedCountries;
    this.validate();
  }

  get stats(): CovidStats {
    return this._stats;
  }

  get affectedCountries(): number {
    return this._affectedCountries;
  }

  validate() {
    GlobalStatsValidatorFactory.create().validate(this);
    if (this.notification.hasErrors()) {
      throw new NotificationError(this.notification.getErrors());
    }
  }
}
