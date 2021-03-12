import * as path from "path";
import * as ncp from "ncp";

process.env.NODE_ENV = "test";
process.env.BINARY_NOTIFICATION_POLLING_INTERVAL = "100";

// eslint-disable-next-line import/first
import { runTests } from "vscode-test";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    const fixtureBinary = path.resolve(__dirname, "./fixture/binaries");
    const targetBinary = path.resolve(__dirname, "../..", "binaries");

    ncp(fixtureBinary, targetBinary, (err) => {
      if (err) {
        console.error("Failed to copy test binaries", err);
        process.exit(1);
      }
    });

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ["--disable-extensions"],
    });
  } catch (err) {
    console.error("Failed to run tests", err);
    process.exit(1);
  }
}

void main();
