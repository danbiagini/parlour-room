import * as shell from "shelljs";

// Copy all the view templates
shell.cp("-R", "src/views", "dist/");

// copy static files
// shell.cp("-R", "src/public", "dist/");

shell.cp("-R", "client/public", "dist/");
