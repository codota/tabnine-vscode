import * as path from "path";
import * as Mocha from "mocha";
import * as glob from "glob";
import * as ncp from "ncp";
import * as rimraf from "rimraf";
import { promisify } from "util";

const promisifyNcp = promisify(ncp);
const promisifyRimraf = promisify(rimraf);

// This is required to run the tests. Do not change to default export.
// eslint-disable-next-line import/prefer-default-export
export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 5 * 60 * 1000,
  });

  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((c, e) => {
    glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
      if (err) {
        e(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
      // await copyTestBinaries(fixtureBinary, targetBinary);

      const fixtureBinary = path.resolve(
        __dirname,
        "..",
        "fixture",
        "binaries"
      );
      const targetBinary = path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "binaries"
      );
      try {
        // Run the mocha test
        void copyTestBinaries(fixtureBinary, targetBinary).then(() => {
          mocha.run((failures) => {
            void clearTestBinaries(targetBinary).then(() => {
              if (failures > 0) {
                e(new Error(`${failures} tests failed.`));
              } else {
                c();
              }
            });
          });
        });
      } catch (error) {
        console.error(error);
        e(error);
      }
    });
  });
}

function copyTestBinaries(
  fixtureBinary: string,
  targetBinary: string
): Promise<void> {
  console.log("copy test binaries");
  return promisifyNcp(fixtureBinary, targetBinary);
}

function clearTestBinaries(targetBinary: string): Promise<void> {
  console.log("clear test binaries");
  return promisifyRimraf(targetBinary);
}
