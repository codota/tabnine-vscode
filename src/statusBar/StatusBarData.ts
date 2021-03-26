/* eslint-disable no-underscore-dangle */
import { ExtensionContext, StatusBarItem } from "vscode";
import { getPersistedAlphaVersion } from "../alphaInstaller";
import { ServiceLevel } from "../binary/state";
import { Capability, isCapabilityEnabled } from "../capabilities";
import {
  FULL_BRAND_REPRESENTATION,
  LIMITATION_SYMBOL,
  STATUS_BAR_FIRST_TIME_CLICKED,
} from "../consts";
import { onThemeChanged } from "../themeHandler";

export default class StatusBarData {
  private _serviceLevel?: ServiceLevel | undefined;

  private _limited = false;

  private _icon?: string;

  private _text?: string;

  constructor(
    private _statusBarItem: StatusBarItem,
    private _context: ExtensionContext
  ) {
    onThemeChanged(() => {
      this.updateStatusBar()
    });
  }

  public set limited(limited: boolean) {
    this._limited = limited;
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
    const issueText = this._text ? `: ${this._text}` : "";
    const serviceLevel =
      this._serviceLevel === "Pro" || this._serviceLevel === "Trial"
        ? " pro"
        : "";
    const limited = this._limited ? ` ${LIMITATION_SYMBOL}` : "";
    this._statusBarItem.text = `${FULL_BRAND_REPRESENTATION}${serviceLevel}${this.getIconText()}${issueText.trimEnd()}${limited}`;
    this._statusBarItem.tooltip =
      isCapabilityEnabled(Capability.SHOW_AGRESSIVE_STATUS_BAR_UNTIL_CLICKED) &&
      !this._context.globalState.get(STATUS_BAR_FIRST_TIME_CLICKED)
        ? "Click 'tabnine' for settings and more information"
        : `${FULL_BRAND_REPRESENTATION} (Click to open settings)${
            getPersistedAlphaVersion(this._context) ?? ""
          }`;
  }

  private getIconText(): string {
    if (this._icon) {
      return ` ${this._icon}`;
    }

    if (
      isCapabilityEnabled(Capability.SHOW_AGRESSIVE_STATUS_BAR_UNTIL_CLICKED) &&
      !this._context.globalState.get(STATUS_BAR_FIRST_TIME_CLICKED)
    ) {
      return " 👈";
    }

    return "";
  }
}
