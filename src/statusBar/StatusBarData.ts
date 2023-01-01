/* eslint-disable no-underscore-dangle */
import { ExtensionContext, StatusBarItem, ThemeColor } from "vscode";
import { CloudConnectionHealthStatus, ServiceLevel } from "../binary/state";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import {
  FULL_BRAND_REPRESENTATION,
  LIMITATION_SYMBOL,
  STATUS_BAR_FIRST_TIME_CLICKED,
} from "../globals/consts";
import { getPersistedAlphaVersion } from "../preRelease/versions";

const INFO_THEME = new ThemeColor("statusBarItem.infoBackground");
const WARNING_THEME = new ThemeColor("statusBarItem.warningBackground");

export default class StatusBarData {
  private _serviceLevel?: ServiceLevel;

  private _cloudConnectionHealthStatus?: CloudConnectionHealthStatus;

  private _limited = false;

  private _icon?: string;

  private _text?: string;

  constructor(
    private _statusBarItem: StatusBarItem,
    private _context: ExtensionContext
  ) {}

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

  public set cloudConnectionHealthStatus(
    cloudConnectionHealthStatus: CloudConnectionHealthStatus | undefined
  ) {
    this._cloudConnectionHealthStatus = cloudConnectionHealthStatus;
    this.updateStatusBar();
  }

  public get cloudConnectionHealthStatus():
    | CloudConnectionHealthStatus
    | undefined {
    return this._cloudConnectionHealthStatus;
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
    const serviceLevel = this.getDisplayServiceLevel();
    const limited = this._limited ? ` ${LIMITATION_SYMBOL}` : "";
    this._statusBarItem.text = `${FULL_BRAND_REPRESENTATION}${serviceLevel}${this.getIconText()}${issueText.trimEnd()}${limited}`;
    this._statusBarItem.tooltip =
      isCapabilityEnabled(Capability.SHOW_AGRESSIVE_STATUS_BAR_UNTIL_CLICKED) &&
      !this._context.globalState.get(STATUS_BAR_FIRST_TIME_CLICKED)
        ? "Click 'tabnine' for settings and more information"
        : `${FULL_BRAND_REPRESENTATION} (Click to open settings)${
            getPersistedAlphaVersion(this._context) ?? ""
          }`;
    this._statusBarItem.backgroundColor =
      this._cloudConnectionHealthStatus === "Failed"
        ? WARNING_THEME
        : INFO_THEME;
  }

  private getDisplayServiceLevel(): string {
    if (this._serviceLevel === "Business") {
      return " enterprise";
    }
    if (this._serviceLevel === "Trial") {
      return " pro";
    }

    return this._serviceLevel === "Pro" ? " pro" : " starter";
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
