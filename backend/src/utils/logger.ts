import winston from "winston";
import { format, TransformableInfo } from "logform";
import { DEBUG_LEVEL } from "./config";

export const logger = winston.createLogger({
  level: DEBUG_LEVEL,
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.align(),
        format.printf(
          (info: TransformableInfo) =>
            `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
  ],
});
