/* eslint-disable */
const fs = require("fs");

let packageJSON = require("../package.json");

let [major, minor, patch] = packageJSON.version.split(".");

const [newPatch] = process.argv.slice(2);

packageJSON = JSON.stringify(
  {
    ...packageJSON,
    version: `${major}.${minor}.${newPatch}`,
  },
  undefined,
  "\t"
);
packageJSON += "\n";

fs.writeFileSync("./package.json", packageJSON);
