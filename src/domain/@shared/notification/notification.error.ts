import { NotificationErrorProps } from "./notification";

export default class NotificationError extends Error {
  constructor(public readonly errors: NotificationErrorProps[]) {
    super(errors.map((error) => `${error.context}: ${error.message}`).join(","));
    this.name = "NotificationError";
  }
}
