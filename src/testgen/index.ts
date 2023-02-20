import { commands, env, ExtensionContext, languages } from "vscode";
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
    { pattern: "**", scheme: "file" },
    new TestGenCodeLensProvider()
  );
  const copyCodeLensProvider = languages.registerCodeLensProvider(
    { pattern: "**", scheme: "untitled" },
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
      void env.clipboard.writeText(codeLens.block);
    }
  );

  context.subscriptions.push(
    codeLensProvider,
    copyCodeLensProvider,
    testGenCommand,
    testCopyCommand
  );
}
