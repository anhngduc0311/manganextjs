import Pino from "pino";

export const logger = Pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: { app: "truyenkomi" },
});

export const workerLogger = logger.child({ scope: "worker" });
