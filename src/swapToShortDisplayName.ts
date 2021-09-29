import { join } from "path";
import { promises as fs } from "fs";

type PackageJson = {
  displayName: string;
  shortDisplayName: string;
};

export default async function swapToShortDisplayName(): Promise<void> {
  const packageJsonPath = join(__dirname, "..", "package.json");

  try {
    const packageJson = JSON.parse(
      await fs.readFile(packageJsonPath, "utf8")
    ) as PackageJson;
    packageJson.displayName = packageJson.shortDisplayName;
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson), "utf8");
  } catch (e) {
    console.error("error while shortetning description", e);
  }
}
