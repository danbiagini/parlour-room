import { transports, format, createLogger } from "winston";

let console_level = "debug";

if (process.env.CONSOLE_LOG_LEVEL) {
  console_level = process.env.CONSOLE_LOG_LEVEL;
}
export const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console({ level: console_level }),
    // new transports.File({ filename: 'logs/error/error.log', level: 'error' }),
    // new transports.File({ filename: 'logs/activity/activity.log', level: 'info' })
  ],
});
