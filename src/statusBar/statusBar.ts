import {
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  window,
} from "vscode";
import { getState } from "../binary/requests/requests";
import { State, ServiceLevel } from "../binary/state";
import { STATUS_BAR_COMMAND } from "../commandsHandler";
import { FULL_BRAND_REPRESENTATION } from "../consts";
import StatusBarData from "./StatusBarData";

const SPINNER = "$(sync~spin)";

let statusBarData: StatusBarData | undefined;
let promotion: StatusBarItem;

export function registerStatusBar(context: ExtensionContext): void {
  if (statusBarData) {
    return;
  }

  const statusBar = window.createStatusBarItem(StatusBarAlignment.Left, -1);
  promotion = window.createStatusBarItem(StatusBarAlignment.Left, -1);

  statusBarData = new StatusBarData(statusBar);
  statusBar.command = STATUS_BAR_COMMAND;
  statusBar.tooltip = `${FULL_BRAND_REPRESENTATION} (Click to open settings)`;
  statusBar.show();

  setLoadingStatus("Starting...");
  context.subscriptions.push(statusBar);
  context.subscriptions.push(promotion);
}

export async function pollServiceLevel(): Promise<void> {
  if (!statusBarData) {
    return;
  }

  const state = await getState();

  statusBarData.serviceLevel = state?.service_level;
}

export async function onStartServiceLevel(): Promise<void> {
  if (!statusBarData) {
    return;
  }

  const state = await getState();

  statusBarData.serviceLevel =
    state?.service_level === "Free"
      ? serviceLevelBaseOnAPIKey(state)
      : state?.service_level;
}

function serviceLevelBaseOnAPIKey(state: State): ServiceLevel {
  return state?.api_key ? "Pro" : "Free";
}

export function setDefaultStatus(): void {
  if (!statusBarData) {
    return;
  }

  statusBarData.icon = null;
  statusBarData.text = null;
}

export function resetDefaultStatuses(): void {
  setDefaultStatus();
  clearPromotion();
}

export function setLoadingStatus(issue?: string | undefined | null): void {
  if (!statusBarData) {
    return;
  }

  statusBarData.text = issue;
  statusBarData.icon = SPINNER;
}

export function setPromotionStatus(message: string, command: string): void {
  if (!statusBarData) {
    return;
  }

  promotion.text = `${message}`;
  promotion.command = command;
  promotion.tooltip = `${FULL_BRAND_REPRESENTATION} - ${message}`;
  promotion.color = "yellow";
  statusBarData.text = " ";
  promotion.show();
}

export function clearPromotion(): void {
  promotion.text = "";
  promotion.tooltip = "";
  promotion.hide();
}
