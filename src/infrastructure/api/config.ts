import * as yup from "yup";

const schema = yup.object({
  PORT: yup.number().default(3333),
  DATABASE_URL: yup.string().required(),
  CORS_ORIGIN: yup.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  API_NINJAS_KEY: yup.string().default(""),
});

export type Config = yup.InferType<typeof schema>;

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return schema.validateSync(env, { stripUnknown: true, abortEarly: false });
}
