import * as yup from "yup";

const schema = yup.object({
  PORT: yup.number().default(3333),
  DATABASE_URL: yup.string().required(),
  CORS_ORIGIN: yup.string().required(),
  API_NINJAS_KEY: yup.string().default(""),
  SYNC_CRON: yup.string().default("0 3 * * *"),
});

export type Config = yup.InferType<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return schema.validateSync(env, { stripUnknown: true, abortEarly: false });
}
