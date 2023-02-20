import { commands, env, ExtensionContext, languages, window } from "vscode";
import { fireEvent } from "../binary/requests/requests";
import generateTests from "./generateTests";
import isTestGenEnabled from "./isTestGenEnabled";

import TabnineCodeLens from "./TabnineCodeLens";
import TestGenCodeLensProvider from "./TestGenCodeLensProvider";

export default function registerTestGenCodeLens(context: ExtensionContext) {
  if (!isTestGenEnabled()) {
    return;
  }
  const codeLensProvider = languages.registerCodeLensProvider(
    [
      { pattern: "**", scheme: "file" },
      { pattern: "**", scheme: "untitled" },
    ],
    new TestGenCodeLensProvider()
  );
  const testGenCommand = commands.registerCommand(
    "tabnine.generate-test",
    generateTests
  );

  const testCopyCommand = commands.registerCommand(
    "tabnine.generate-copy",
    (codeLens: TabnineCodeLens) => {
      void fireEvent({
        name: "test-generation-accepted",
        language: codeLens.languageId,
      });
      void env.clipboard
        .writeText(codeLens.block)
        .then(() => window.showInformationMessage("Test copied to clipboard"));
    }
  );

  context.subscriptions.push(codeLensProvider, testGenCommand, testCopyCommand);
}
