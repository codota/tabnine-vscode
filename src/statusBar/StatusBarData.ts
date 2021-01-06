/* eslint-disable no-underscore-dangle */
import { StatusBarItem } from "vscode";
import { ServiceLevel } from "../binary/state";
import { FULL_BRAND_REPRESENTATION } from "../consts";

export default class StatusBarData {
  private _serviceLevel?: ServiceLevel | undefined;

  private _limited = false;

  private _icon?: string;

  private _text?: string;

  constructor(private _statusBarItem: StatusBarItem) {}

  public set limited(limited: boolean){
    this._limited =  limited;
    this.updateStatusBar();
  }

  public set serviceLevel(serviceLevel: ServiceLevel | undefined) {
    this._serviceLevel = serviceLevel;
    this.updateStatusBar();
  }

  public get serviceLevel(): ServiceLevel | undefined {
    return this._serviceLevel;
  }

  public set icon(icon: string | undefined | null) {
    this._icon = icon || undefined;
    this.updateStatusBar();
  }

  public get icon(): string | undefined | null {
    return this._icon;
  }

  public set text(text: string | undefined | null) {
    this._text = text || undefined;
    this.updateStatusBar();
  }

  public get text(): string | undefined | null {
    return this._text;
  }

  private updateStatusBar() {
    const iconText = this._icon ? ` ${this._icon}` : "";
    const issueText = this._text ? `: ${this._text}` : "";
    const serviceLevel =
      this._serviceLevel === "Pro" || this._serviceLevel === "Trial"
        ? " pro"
        : "";

    const limited = this._limited ? " $(lock)" : "";

    this._statusBarItem.text = `${FULL_BRAND_REPRESENTATION}${serviceLevel}${iconText}${issueText.trimEnd()}${limited}`;
  }
}
