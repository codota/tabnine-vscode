import { TabNine } from './TabNine';

async function main() {
    let code = await TabNine.reportUninstall();

    process.exit(code);
}

main().catch(console.error);
