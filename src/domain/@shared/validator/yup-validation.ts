import * as yup from "yup";
import Entity from "../entity/entity.abstract";

export function validateWithYup(
  entity: Entity,
  context: string,
  schema: yup.Schema,
  value: unknown,
) {
  try {
    schema.validateSync(value, { abortEarly: false });
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) throw error;
    error.errors.forEach((message) => entity.notification.addError({ context, message }));
  }
}
