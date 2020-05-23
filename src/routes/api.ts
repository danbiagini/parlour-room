import * as express from "express";
// import pgPromise from "pg-promise";

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
