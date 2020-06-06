import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const c = dotenv.config();
dotenvExpand(c);
process.env.NODE_ENV = "test";
console.log("Test setup complete");
