import { TabNine } from './TabNine';

async function main() {
    let code = await TabNine.reportUninstalled();

    process.exit(code);
}

main().catch(console.error);
