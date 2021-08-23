import { extensions, window } from "vscode";
import * as path from "path";
import * as fs from "fs";

const tabnineExtensionId = "tabnine.tabnine-vscode";

export default function ensureProposedApiEnabled(): void {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const tabnineExtension = extensions.getExtension(tabnineExtensionId)!;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!tabnineExtension?.packageJSON.enableProposedApi) {
    const packageJSONPath = path.join(
      tabnineExtension.extensionPath,
      "package.json"
    );

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = JSON.parse(fs.readFileSync(packageJSONPath, "utf8"));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      json.enableProposedApi = true;
      fs.writeFileSync(
        packageJSONPath,
        `${JSON.stringify(json, undefined, 2)}\n`,
        "utf8"
      );
    } catch (err) {
      console.error("Failed to enable proposed api: ", err);
    }
  }

  void window.showErrorMessage(
    `Tabnine: Open VSCode as follows: "code-insiders --enable-proposed-api ${tabnineExtensionId}"\nTabnine requires the use of proposed (read: experimental) APIs to provide snippet completions. To enable snippets, you must run VSCode Insiders as described above.`
  );
}
