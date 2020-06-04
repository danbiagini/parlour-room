import * as express from "express";
// import { Pool } from "pg";
import { logger } from "../common/logger";
import { loginWithGoogleIdToken } from "./google_utils";

// import { url } from 'inspector';

export const api = express.Router();

api.get("/auth/google", (req, res) => {
  if (req.query.code) {
    const user = loginWithGoogleIdToken(req.query.code.toString())
      .then((user) => {
        if (user.email) {
          logger.info("got the email ${user.email}, lets render!");
        }

        if (user.lastName || user.firstName) {
          logger.info("got the full name: ${user.firstName} ${user.lastName}");
        }
        return user;
      })
      .catch(() => {
        logger.info("Unable to get google user info");
      });
    res.send(user);
  } else {
    logger.info("no code on auth/google request:" + req.params);
    res.sendStatus(400);
  }
});

// export const register = ( app: express.Application ) => {
//     const oidc = app.locals.oidc;
//     const port = parseInt( process.env.PGPORT || "5432", 10 );
//     const config = {
//         database: process.env.PGDATABASE || "postgres",
//         host: process.env.PGHOST || "localhost",
//         port,
//         user: process.env.PGUSER || "postgres"
//     };

//     const pgp = pgPromise();
//     const db = pgp( config );

//     app.get( `/api/auth/google`, oidc.ensureAuthenticated(), async ( req: any, res ) => {
//         try {
//             const userId = req.userContext.userinfo.sub;
//             const guitars = await db.any( `
//                 SELECT
//                     id
//                     , brand
//                     , model
//                     , year
//                     , color
//                 FROM    guitars
//                 WHERE   user_id = $[userId]
//                 ORDER BY year, brand, model`, { userId } );
//             return res.json( guitars );
//         } catch ( err ) {
//             // tslint:disable-next-line:no-console
//             console.error(err);
//             res.json( { error: err.message || err } );
//         }
//     } );
