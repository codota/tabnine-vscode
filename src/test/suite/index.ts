import * as path from "path";
import * as Mocha from "mocha";
import * as glob from "glob";

// This is required to run the tests. Do not change to default export.
// eslint-disable-next-line import/prefer-default-export
export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 5 * 60 * 1000,
  });

  const testsRoot = path.resolve(__dirname, "..");

  try {
    const files = await glob.glob("**/**.test.js", { cwd: testsRoot });

    // Add files to the test suite
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

    // Run the mocha test
    mocha.run((failures) => {
      if (failures > 0) {
        throw new Error(`${failures} tests failed.`);
      }
    });
  } catch (error) {
    console.error(error);
  }
}
