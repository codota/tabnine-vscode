import * as vscode from "vscode";



export default class TabnineItem extends vscode.TreeItem {

  constructor(
    public readonly label: string,
    public readonly command?: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `${this.label}`;
  }
  
  contextValue = 'tabnine';
}
