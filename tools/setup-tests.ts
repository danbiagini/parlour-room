import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const c = dotenv.config();
dotenvExpand(c);
console.log("Test setup complete");
