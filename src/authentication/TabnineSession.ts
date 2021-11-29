import { AuthenticationSession } from "vscode";
import { BRAND_NAME } from "../globals/consts";

export default class TabnineSession implements AuthenticationSession {

  readonly id = BRAND_NAME;

  readonly scopes = [];

  readonly accessToken = "";

  readonly account: { id: string; label: string; };

  constructor(userName: string = BRAND_NAME) {
    this.account = { id: userName, label: userName };
  }
}
