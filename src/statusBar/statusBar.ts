import {
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  ThemeColor,
  window,
} from "vscode";
import { STATUS_BAR_COMMAND } from "../commandsHandler";
import { ATTRIBUTION_BRAND, BRAND_NAME } from "../consts";

const SPINNER = "$(sync~spin)";
const WARNING = "$(warning)";

let statusBar: StatusBarItem;
let promotion: StatusBarItem;

export function registerStatusBar(context: ExtensionContext): void {
  if (statusBar) {
    return;
  }

  statusBar = window.createStatusBarItem(StatusBarAlignment.Left, -1);
  promotion = window.createStatusBarItem(StatusBarAlignment.Left, -1);
  setDefaults();
  setLoadingStatus("Starting...");
  statusBar.show();

  context.subscriptions.push(statusBar);
  context.subscriptions.push(promotion);
}
function setDefaults(): void {
  statusBar.command = STATUS_BAR_COMMAND;
  statusBar.tooltip = `${BRAND_NAME} (Click to open settings)`;
}

export function setDefaultStatus(): void {
  setStatusBar();
}
export function resetToDefaultStatus(): void {
  setDefaults();
  setStatusBar();
  clearPromotion();
  
}

export function setLoadingStatus(issue?: string | undefined | null): void {
  setStatusBar(SPINNER, issue);
}

export function setErrorStatus(issue?: string | undefined | null): void {
  setStatusBar(WARNING, issue);
  statusBar.color = new ThemeColor("errorForeground");
}

export function setPromotionStatus(message: string, command: string): void{
  promotion.text = `${message}`;
  promotion.command = command;
  promotion.tooltip = `${BRAND_NAME} - ${message}`;
  promotion.color = "yellow";
  statusBar.text = `${ATTRIBUTION_BRAND}${BRAND_NAME}:`;
  promotion.show();
}
export function clearPromotion(): void {
  promotion.text = "";
  promotion.tooltip = "";
  promotion.hide();
  setStatusBar();
}

function setStatusBar(
  icon?: string | undefined | null,
  issue?: string | undefined | null
) {
  const iconText = icon ? ` ${icon}` : "";
  const issueText = issue ? `: ${issue}` : "";

  statusBar.text = `${ATTRIBUTION_BRAND}${BRAND_NAME}${iconText}${issueText}`;
}
