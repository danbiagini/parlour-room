import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const c = dotenv.config();
dotenvExpand(c);

import yargs, { Argv } from "yargs";

if (process.env.GM_DBURL) {
  process.env.POSTGRAPHILE_URL = process.env.GM_DBURL;
}

import {
  createUsers,
  deleteTestData,
  saveParlour,
} from "../src/db/test/helper";
import { Parlour } from "../src/common/types";
import { getUserByEmail } from "../src/server/parlour_db";

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
  .command(
    "parlour",
    "Create a parlour",
    (yargs: Argv) => {
      return yargs
        .option("creator_uid", {
          describe: "Initial member / creator of the parlour",
          type: "string",
        })
        .option("creator_email", {
          describe: "Email address for the creator user",
          type: "string",
        })
        .option("admin", {
          describe: "Make the parlour the 'administrator' parlour",
          boolean: true,
        })
        .option("test_id", {
          describe: "Test identifier for easier cleanup",
          default: "db.fixtures",
          type: "string",
        })
        .check(({ creator_uid, creator_email }) => {
          if (!creator_uid && !creator_email) {
            throw new Error(
              "Need to specify either creator_uid or creator_email"
            );
          }
          return true;
        });
    },
    async (argv) => {
      if (!argv.creator_uid) {
        argv.creator_uid = (await getUserByEmail(argv.creator_email)).uid;
      }

      const par: Parlour = {
        name: argv.test_id,
        description: "Fixture Parlour",
        creator_uid: argv.creator_uid,
      };

      if (argv.admin) {
        par.uid = process.env.ADMIN_PARLOUR_UID;
        par.name = "Admin Parlour";
        par.description = "Administrators Lounge";
      }
      await saveParlour(par);
    }
  )
  .help().argv;
