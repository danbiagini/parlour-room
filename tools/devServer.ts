import {createProxyMiddleware} from "http-proxy-middleware";
import Bundler from "parcel-bundler";
import express from "express";

const entry = process.env.ENTRY || "src/index.html";

const bundler = new Bundler(entry, {
  // Don't cache anything in development
  cache: false,
});

const app = express();
const API_PORT = process.env.PORT || 8080;
const PORT = 1234;

// This route structure is specifc to Netlify functions, so
// if you're setting this up for a non-Netlify project, just use
// whatever values make sense to you.  Probably something like /api/**

app.use(
  "/api/",
  createProxyMiddleware({
    // Your local server
    target: `http://localhost:${API_PORT}`,
    // Your production routes
    // pathRewrite: {
    //   "/.netlify/functions/": "",
    // },
  })
);

// Pass the Parcel bundler into Express as middleware
app.use(bundler.middleware());

// Run your Express server
app.listen(PORT);
