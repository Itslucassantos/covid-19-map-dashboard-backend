import Notification from "../notification/notification";

export default abstract class Entity {
  protected _id!: string;
  readonly notification = new Notification();

  get id(): string {
    return this._id;
  }
}
