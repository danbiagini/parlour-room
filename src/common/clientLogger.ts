import { getLogger, LogLevelDesc } from "loglevel";

let client_level: LogLevelDesc = "error";
if (process.env.CLIENT_LOG_LEVEL) {
  client_level = process.env.CLIENT_LOG_LEVEL as LogLevelDesc;
}
export const clientLogger = getLogger("client_default");
clientLogger.setLevel(client_level);
