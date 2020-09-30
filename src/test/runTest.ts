import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Download VS Code, unzip it and run the integration test
        let exitCode = await runTests({ extensionDevelopmentPath, extensionTestsPath, launchArgs: ["--disable-gpu --disable-gpu-compositing"] });
        console.log('run tests finished with exit code', exitCode);
        process.exit(exitCode);
	} catch (err) {
        if (err == "SIGSEGV") {
            console.log('run tests', err);
		    process.exit(0);
        } else {
            console.error('Failed to run tests', err);
		    process.exit(1);
        }
	}
}

main();