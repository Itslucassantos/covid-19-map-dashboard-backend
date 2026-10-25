export type LogFields = Record<string, unknown>;

export interface Logger {
  info(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
}

export const jsonLogger: Logger = {
  info: (msg, fields) => console.log(JSON.stringify({ level: "info", msg, ...fields })),
  error: (msg, fields) => console.error(JSON.stringify({ level: "error", msg, ...fields })),
};

export const silentLogger: Logger = { info: () => undefined, error: () => undefined };
