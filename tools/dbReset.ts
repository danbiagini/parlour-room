import * as shell from "shelljs";
import readline from "readline";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const c = dotenv.config();
dotenvExpand(c);

import { exit } from "process";

const eraseDb = () => {
  const cmd = "graphile-migrate reset --erase";
  shell.exec(cmd);
};

const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const database_url = process.env.ROOT_DATABASE_URL;
r1.question(
  `Are you sure you want to reset the databse at ${database_url} [y|n]? `,
  (yes) => {
    if (yes != "Y" && yes != "y") {
      console.log(`${yes} is not "Y" or "y", aborting`);
      exit();
    }
    eraseDb();
    r1.close();
  }
);
