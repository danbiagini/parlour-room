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
  createInvitation,
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
        .option("name", {
          describe: "Name (or test identifier for easier cleanup)",
          default: "db.fixtures",
          type: "string",
        })
        .option("with_email_invite", {
          describe: "Create an email based invitation for this Parlour",
          type: "string",
        })
        .option("with_open_invite", {
          describe: "Create an open invitation for this parlour",
          default: false,
        });
    },
    async (argv) => {
      if (!argv.creator_uid && argv.creator_email) {
        argv.creator_uid = (await getUserByEmail(argv.creator_email)).uid;
      }

      const par: Parlour = {
        name: argv.name,
        description: "Fixture Parlour",
        creator_uid: argv.creator_uid,
      };

      if (argv.admin) {
        par.uid = process.env.ADMIN_PARLOUR_UID;
        par.name = "Admin Parlour";
        par.description = "Administrators Lounge";
      }
      const createdPar = await saveParlour(par);

      if (argv.with_email_invite) {
        await createInvitation(
          createdPar.uid,
          argv.with_email_invite,
          argv.name
        );
      }

      if (argv.with_open_invite) {
        await createInvitation(createdPar.uid, "", argv.name);
      }
    }
  )
  .help().argv;
