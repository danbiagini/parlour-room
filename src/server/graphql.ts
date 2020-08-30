import * as express from "express";
import { IRequestSession } from "./sessions";
import { postgraphile, PostGraphileOptions } from "postgraphile";
import { getParlourDbPool } from "./parlour_db";

const { DB_POSTGRAPHILE_USER, DB_ANON_USER, DB_SIGNEDIN_USER } = process.env;

if (!DB_POSTGRAPHILE_USER) {
  throw new Error("graphql init error, no DB_POSTGRAPHILE_USER set");
}

if (!DB_ANON_USER) {
  throw new Error("graphql init error, no anonymous user set");
}

if (!DB_SIGNEDIN_USER) {
  throw new Error("graphql init error, no signed in user set");
}

export const graphql = express.Router();

const graphqlOptions: PostGraphileOptions = {
  externalUrlBase: "/graphql",
  ignoreRBAC: false,
  ignoreIndexes: false,
  setofFunctionsContainNulls: false,
  dynamicJson: true,
  appendPlugins: [require("@graphile-contrib/pg-simplify-inflector")],
  legacyRelations: "omit",
  enableQueryBatching: true,
  graphqlRoute: "/",
  // additionalGraphQLContextFromRequest: async (req, res) => {
  //   return {
  //     user_id: req.session.user_id,
  //   }
  // },
  pgSettings: async (request: IRequestSession) => ({
    "parlour.user.uid": `${request.session.user_id}`,
    // eslint-disable-next-line prettier/prettier
    "role": `${request.session.role}`,
  }),
};

if (process.env.NODE_ENV !== "production") {
  const graphqlDevOptions = {
    // Customizations
    ownerConnectionString: process.env.ROOT_DATABASE_URL,

    // Recommended options from https://www.graphile.org/postgraphile/usage-library/#for-development
    subscriptions: true,
    watchPg: true,
    showErrorStack: true,
    extendedErrors: [
      "hint",
      "detail",
      "errcode",
      "severity",
      "positon",
      "internalPosition",
      "internalQuery",
      "where",
      "schema",
      "table",
      "column",
      "dataType",
      "constraint",
      "file",
      "line",
      "routine",
    ],
    exportGqlSchemaPath: "src/generated/schema.graphql",
    graphiqlRoute: "/graphiql",
    graphiql: true,
    enhanceGraphiql: true,
    enableCors: true,
    allowExplain: true,
    // allowExplain(req) {
    //   // TODO: customise condition!
    //   return true;
    // },
  };
  if (process.env.NODE_ENV === "test") {
    graphqlDevOptions.graphiql = false;
    graphqlDevOptions.ownerConnectionString = undefined;
    graphqlDevOptions.exportGqlSchemaPath = undefined;
    graphqlDevOptions.watchPg = false;
  }
  Object.assign(graphqlOptions, graphqlDevOptions);
} else {
  const graphqlProdOptions = {
    // Recommended options from https://www.graphile.org/postgraphile/usage-library/#for-production

    subscriptions: false, // reco is true, but not sure why
    retryOnInitFail: true,
    dynamicJson: true,
    setofFunctionsContainNulls: false,
    extendedErrors: ["errcode"],
    graphiql: false,
    disableQueryLog: true, // our default logging has performance issues, but do make sure you have a logging system in place!
  };
  Object.assign(graphqlOptions, graphqlProdOptions);
}

const pgPool = getParlourDbPool(DB_POSTGRAPHILE_USER);

graphql.use(postgraphile(pgPool, "parlour_public", graphqlOptions));
