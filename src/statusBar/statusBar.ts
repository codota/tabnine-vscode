import {
  ExtensionContext,
  StatusBarAlignment,
  window,
} from "vscode";
import { getState } from "../binary/requests/requests";
import { ServiceLevel, State } from "../binary/state";
import { STATUS_BAR_COMMAND } from "../commandsHandler";
import { FULL_BRAND_REPRESENTATION } from "../consts";
import StatusBarData from "./StatusBarData";
import StatusBarPromotionItem from "./StatusBarPromotionItem";

const SPINNER = "$(sync~spin)";

let statusBarData: StatusBarData | undefined;
let promotion: StatusBarPromotionItem | undefined;

export function registerStatusBar(context: ExtensionContext): void {
  if (statusBarData) {
    return;
  }

  const statusBar = window.createStatusBarItem(StatusBarAlignment.Left, -1);
  promotion = new StatusBarPromotionItem(window.createStatusBarItem(StatusBarAlignment.Left, -1));
  statusBarData = new StatusBarData(statusBar, context);
  statusBar.command = STATUS_BAR_COMMAND;
  statusBar.show();

  setLoadingStatus("Starting...");
  context.subscriptions.push(statusBar);
  context.subscriptions.push(promotion!.item);
}

export async function pollServiceLevel(): Promise<void> {
  if (!statusBarData) {
    return;
  }

  const state = await getState();

  statusBarData.serviceLevel = state?.service_level;
}

export function promotionTextIs(text: string): boolean {
  return promotion?.item?.text === text;
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

export function resetDefaultStatus(id?: string): void {
  if (!id || (promotion && promotion.id && promotion.id === id)) {
    setDefaultStatus();
    clearPromotion();
  }
}

export function setLoadingStatus(issue?: string | undefined | null): void {
  if (!statusBarData) {
    return;
  }

  statusBarData.text = issue;
  statusBarData.icon = SPINNER;
}
export function setCompletionStatus(limited = false): void {
  if (!statusBarData) {
    return;
  }
  statusBarData.limited = limited;
}


export function setPromotionStatus(id: string, message: string, tooltip: string, command: string): void {
  if (!statusBarData || !promotion) {
    return;
  }

  promotion.id = id;
  promotion.item.text = message;
  promotion.item.command = command;
  promotion.item.tooltip = `${FULL_BRAND_REPRESENTATION} - ${tooltip}`;
  promotion.item.color = "yellow";
  statusBarData.text = " ";
  promotion.item.show();
}

export function clearPromotion(): void {
  if (!promotion) {
    return;
  }

  promotion.item.text = "";
  promotion.item.tooltip = "";
  promotion.item.hide();
}
