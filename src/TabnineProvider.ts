import * as vscode from "vscode";
import TabnineItem from "./TabnineItem";

export default class TabnineProvider implements vscode.TreeDataProvider<TabnineItem> {
    onDidChangeTreeData?: vscode.Event<void | TabnineItem | null | undefined> | undefined;

    // eslint-disable-next-line class-methods-use-this
    getTreeItem(element: TabnineItem): vscode.TreeItem  {
        return element as vscode.TreeItem;
    }

    // eslint-disable-next-line class-methods-use-this
    getChildren():vscode.ProviderResult<TabnineItem[]> {

        return Promise.resolve([new TabnineItem("Home",{
            command: 'tabnine:home',
            title: 'Tabnine Home',
        }),
        new TabnineItem("Status",{
            command: 'tabnine:status',
            title: 'Tabnine Status',
        }),
        new TabnineItem("Preferences",{
            command: 'tabnine:preferences',
            title: 'Tabnine Preferences',
        }),
        new TabnineItem("Info",{
            command: 'tabnine:info',
            title: 'Tabnine Info',
        })]);
    }
}
