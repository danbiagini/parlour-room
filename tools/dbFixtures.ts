import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const c = dotenv.config();
dotenvExpand(c);

import yargs, { Argv } from "yargs";

let argv = yargs
  .command(
    ["users", "$0"],
    "Create fictitious users for testing",
    (yargs: Argv) => {
      return yargs.option("count", {
        describe: "Number of users to create",
        default: 10,
        type: "number",
      });
    }
  )
  .help().argv;

if (process.env.GM_DBURL) {
  process.env.POSTGRAPHILE_URL = process.env.GM_DBURL;
}

console.log(
  "lets create " + argv.count + " users in DB:" + process.env.POSTGRAPHILE_URL
);

import { createUsers } from "../src/db/test/helper";

createUsers(argv.count);
