import * as winston from "winston";

let console_level = "debug";

if (process.env.SERVER_LOG_LEVEL) {
  console_level = process.env.SERVER_LOG_LEVEL;
}

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ level: console_level }),
    // new transports.File({ filename: 'logs/error/error.log', level: 'error' }),
    // new transports.File({ filename: 'logs/activity/activity.log', level: 'info' })
  ],
});
