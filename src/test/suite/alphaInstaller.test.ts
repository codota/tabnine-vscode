import * as sinon from "sinon";
import { afterEach, beforeEach } from "mocha";

import { assertSuccessfulInstalled, assertWasNotInstalled, initMocks, runInstallation } from "./utils/alphaInstaller.utils";


suite("Should update alpha release", () => {

    beforeEach(initMocks);
    
    afterEach(() => {
        sinon.restore();
    });

    test("in case of not alpha, do nothing", async () => {
        await runInstallation("3.0.11-alpha", "v3.1.11", '1.32.0', false)

        assertWasNotInstalled();
    });
    test("in case of alpha and unsupported vscode api(1.35), do nothing", async () => {
        await runInstallation("3.0.11-alpha", "v3.1.11", '1.32.0')
        assertWasNotInstalled();
    });

    ['3.1.10', '3.0.10'].forEach((installed) => {
        test(`in case of TabNine released version is lower or equal to current version (${installed}), do nothing`, async () => {
            await runInstallation(installed, "v3.0.10")
            assertWasNotInstalled();
        })
    })
    test("in case of newer GA version, do nothing", async () => {
        await runInstallation("3.0.11-alpha", "v3.1.11");
        assertWasNotInstalled();
    })

    test("in case of newer alpha version and current GA should update", async () => {
        await runInstallation("3.0.11", "v3.1.11-alpha");
        assertSuccessfulInstalled();
    })
    test("in case of same version and alpha version and current GA should update", async () => {
        await runInstallation("3.1.11", "v3.1.11-alpha.1234");
        assertSuccessfulInstalled();
    })

    test("in case of newer alpha version, install the new one", async () => {
        await runInstallation("3.1.10-alpha.150", "v3.1.10-alpha.280345345");
        assertSuccessfulInstalled();
    })
})


