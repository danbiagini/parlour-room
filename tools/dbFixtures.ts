import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const c = dotenv.config();
dotenvExpand(c);

import yargs, { Argv } from "yargs";

if (process.env.GM_DBURL) {
  process.env.POSTGRAPHILE_URL = process.env.GM_DBURL;
}

import { createUsers, deleteTestData } from "../src/db/test/helper";

yargs
  .command(
    ["users"],
    "Create fictitious users for testing",
    (yargs: Argv) => {
      return yargs
        .option("count", {
          describe: "Number of users to create",
          default: 10,
          type: "number",
        })
        .option("test_id", {
          describe: "Test identifier for easier cleanup",
          default: "db.fixtures",
          type: "string",
        });
    },
    (argv) => {
      console.log(
        "lets create " +
          argv.count +
          " users in DB:" +
          process.env.POSTGRAPHILE_URL
      );
      createUsers(argv.count, argv.test_id);
    }
  )
  .command(
    "delete",
    "Delete test data",
    (yargs: Argv) => {
      return yargs.option("test_id", {
        describe: "Test data identifier to delete",
        type: "string",
        default: "db.fixtures",
      });
    },
    (argv) => {
      deleteTestData(argv.test_id);
    }
  )
  .help().argv;
