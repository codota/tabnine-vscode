/* eslint-disable no-underscore-dangle */
import {
  Disposable,
  ExtensionContext,
  StatusBarItem,
  ThemeColor,
} from "vscode";
import { ServiceLevel } from "../binary/state";
import {
  Capability,
  isCapabilitiesReady,
  isCapabilityEnabled,
} from "../capabilities/capabilities";
import {
  ATTRIBUTION_BRAND,
  FULL_BRAND_REPRESENTATION,
  LIMITATION_SYMBOL,
  STATUS_BAR_FIRST_TIME_CLICKED,
} from "../globals/consts";
import { getPersistedAlphaVersion } from "../preRelease/versions";
import { shouldStatusBarBeProminent } from "../registration/forceRegistration";
import { completionsState } from "../state/completionsState";

export default class StatusBarData implements Disposable {
  private _serviceLevel?: ServiceLevel;

  private _limited = false;

  private _icon?: string;

  private _text?: string;

  private _isLoggedIn?: boolean;

  constructor(
    private _statusBarItem: StatusBarItem,
    private _context: ExtensionContext
  ) {}

  dispose() {
    this._statusBarItem.dispose();
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

  public set isLoggedIn(isLoggedIn: boolean | undefined) {
    this._isLoggedIn = isLoggedIn;
    this.updateStatusBar();
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

  public updateStatusBar() {
    const issueText = this._text ? `: ${this._text}` : "";
    const serviceLevel = this.getDisplayServiceLevel();
    const limited = this._limited ? ` ${LIMITATION_SYMBOL}` : "";
    this._statusBarItem.text = `${FULL_BRAND_REPRESENTATION}${serviceLevel}${this.getIconText()}${issueText.trimEnd()}${limited}`;
    if (shouldStatusBarBeProminent()) {
      this._statusBarItem.text = `${ATTRIBUTION_BRAND}Tabnine: Sign-in is required`;
      this._statusBarItem.backgroundColor = new ThemeColor(
        "statusBarItem.warningBackground"
      );
    } else if (!completionsState.value) {
      this._statusBarItem.backgroundColor = new ThemeColor(
        "statusBarItem.warningBackground"
      );
    } else {
      this._statusBarItem.backgroundColor = undefined;
    }
    if (
      this._serviceLevel === "Free" &&
      !this._isLoggedIn &&
      isCapabilityEnabled(Capability.FORCE_REGISTRATION)
    ) {
      this._statusBarItem.tooltip = "Sign in using your Tabnine account";
    } else {
      this._statusBarItem.tooltip =
        isCapabilityEnabled(
          Capability.SHOW_AGRESSIVE_STATUS_BAR_UNTIL_CLICKED
        ) && !this._context.globalState.get(STATUS_BAR_FIRST_TIME_CLICKED)
          ? "Click 'tabnine' for settings and more information"
          : `${FULL_BRAND_REPRESENTATION} (Show options)${
              getPersistedAlphaVersion(this._context) ?? ""
            }`;
    }
  }

  private getDisplayServiceLevel(): string {
    if (!isCapabilitiesReady()) {
      return "";
    }

    if (this._serviceLevel === "Business") {
      return " enterprise";
    }
    if (this._serviceLevel === "Trial") {
      return " pro";
    }

    if (this._serviceLevel === undefined) {
      return "";
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
