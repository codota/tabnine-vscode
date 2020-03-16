
import * as Path from 'path';
import * as vscode from 'vscode';
import { PathHelper } from './helpers/path-helper';


export class ImportObject {

    name: string;
    file: vscode.Uri;
    isDefault: boolean;
    discovered: boolean;

    constructor(name: string, file: vscode.Uri, isDefault: boolean, discovered: boolean = false) {
        this.name = name;
        this.file = file;
        this.isDefault = isDefault;
        this.discovered = discovered;
    }

    getPath(document: vscode.TextDocument): string {
        if (this.discovered) {
            return this.file.fsPath;
        }
        const absolute = vscode.workspace.getConfiguration('autoimport').get<boolean>('absolute');
        let basePath = document.uri.fsPath;

        if (absolute) {
            const sourceRoot = vscode.workspace.getConfiguration('autoimport').get<string>('sourceRoot');
            basePath = PathHelper.joinPaths(vscode.workspace.rootPath, sourceRoot);
        }
        return PathHelper.normalisePath(PathHelper.getRelativePath(basePath, this.file.fsPath), absolute);
    }
}


export class ImportDb {

    private static imports: Array<ImportObject> = new Array<ImportObject>();

    public static get count() {

        return ImportDb.imports.length;
    }

    public static all(): Array<ImportObject> {
        return ImportDb.imports;
    }

    public static getImport(name: string): Array<ImportObject> {
        return ImportDb.imports.filter(i => i.name === name);
    }

    public static delete(request: any): void {

        try {

            let index = ImportDb.imports.findIndex(m => m.file.fsPath === request.file.fsPath);

            if (index !== -1) {
                ImportDb.imports.splice(index, 1);
            }

        } catch (error) {

        }

    }

    public static saveImport(name: string, data: any, file: any, isDefault: boolean = false, discovered: boolean): void {

        name = name.trim();

        if (name === '' || name.length === 1) {
            return;
        }


        let obj: ImportObject = new ImportObject(name, file, isDefault, discovered);

        let exists = ImportDb.imports.findIndex(m => m.name === obj.name && m.file.fsPath === file.fsPath);

        if (exists === -1) {
            ImportDb.imports.push(obj);
        }

    }
}
