import * as shell from "shelljs";

// copy static files
shell.cp("-R", "src/public", "dist/");

shell.cp("-R", "client/public", "dist/");
