import { CodeAction } from "vscode";

const importStatement = /Import ([\S]*) from module [\S]*/;
const existingImportStatement = /Add ([\S]*) to existing import declaration from [\S]*/;
const importDefaultStatement = /Import default ([\S]*) from module [\S]*/;
const existingDefaultImportStatement = /Add default import ([\S]*) to existing import declaration from [\S]*/;
const importStatements = [
  importStatement,
  existingImportStatement,
  importDefaultStatement,
  existingDefaultImportStatement,
];

/*
 filter imports with same name from different modules
 for example if there are multiple modules with same exported name: 
 Import {foo} from './a' and Import {foo} from './b'
 in this case we will ignore and not auto import it
*/
export default function findImports(
  codeActionCommands: CodeAction[] = []
): CodeAction[] {
  const importCommands = codeActionCommands.filter(({ title }) =>
    importStatements.some((statement) => statement.test(title))
  );

  const importNames = importCommands.map(getImportName);

  return importCommands.filter(
    (command) =>
      importNames.filter((name) => name === getImportName(command)).length <= 1
  );
}

function getImportName({
  title,
}: {
  title: string;
}): string | undefined | null {
  const statement = importStatements.map((s) => s.exec(title)).find(Boolean);

  return statement && statement[1];
}
