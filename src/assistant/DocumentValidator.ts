import * as vscode from "vscode";
import getValidExtensions from "./requests/getValidExtensions";
import getValidLanguages from "./requests/getValidLanguages";

export class DocumentValidator {
  private validLanguages: string[];

  private validExtensions: string[];

  constructor(validLanguages: string[], validExtensions: string[]) {
    this.validLanguages = validLanguages;

    this.validExtensions = validExtensions;
  }

  public isValid(document: vscode.TextDocument): boolean {
    const { fileName } = document;
    const fileExt = `.${fileName?.split(".").pop() || ""}`;
    return (
      this.validExtensions?.includes(fileExt) &&
      this.validLanguages?.includes(document.languageId)
    );
  }
}

export default async function getValidator(): Promise<DocumentValidator> {
  const validLanguages = await getValidLanguages();
  const validExtensions = await getValidExtensions();

  const documentValidator = new DocumentValidator(
    validLanguages,
    validExtensions
  );
  return documentValidator;
}
