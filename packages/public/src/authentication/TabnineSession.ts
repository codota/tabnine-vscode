import { AuthenticationSession } from "vscode";
import { BRAND_NAME } from "../globals/consts";

const DEFAULT_USER_IDENTIFIER = "Tabnine Authentication";

export default class TabnineSession implements AuthenticationSession {
  readonly id = BRAND_NAME;

  readonly scopes = [];

  readonly accessToken: string;

  readonly account: { id: string; label: string };

  constructor(userName: string = DEFAULT_USER_IDENTIFIER, accessToken = "") {
    this.account = { id: userName, label: userName };
    this.accessToken = accessToken;
  }
}
