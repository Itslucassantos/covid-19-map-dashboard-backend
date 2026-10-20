import Entity from "../../@shared/entity/entity.abstract";
import NotificationError from "../../@shared/notification/notification.error";
import DailyStatValidatorFactory from "../validator/daily-stat.validator.factory";

export type DailyStatProps = {
  // null means the global scope (sum of all countries)
  countryIso2: string | null;
  date: string;
  cases: number;
  deaths: number;
  newCases: number;
  newDeaths: number;
};

export default class DailyStat extends Entity {
  private _countryIso2: string | null;
  private _date: string;
  private _cases: number;
  private _deaths: number;
  private _newCases: number;
  private _newDeaths: number;

  constructor(props: DailyStatProps) {
    super();
    this._id = `${props.countryIso2 ?? "global"}:${props.date}`;
    this._countryIso2 = props.countryIso2;
    this._date = props.date;
    this._cases = props.cases;
    this._deaths = props.deaths;
    this._newCases = props.newCases;
    this._newDeaths = props.newDeaths;
    this.validate();
  }

  get countryIso2(): string | null {
    return this._countryIso2;
  }

  get date(): string {
    return this._date;
  }

  get cases(): number {
    return this._cases;
  }

  get deaths(): number {
    return this._deaths;
  }

  get newCases(): number {
    return this._newCases;
  }

  get newDeaths(): number {
    return this._newDeaths;
  }

  validate() {
    DailyStatValidatorFactory.create().validate(this);
    if (this.notification.hasErrors()) {
      throw new NotificationError(this.notification.getErrors());
    }
  }
}
