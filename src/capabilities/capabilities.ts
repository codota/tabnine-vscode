import * as vscode from "vscode";
import { Disposable, EventEmitter } from "vscode";
import {
  ExperimentSource,
  getCapabilities,
  tabNineProcess,
} from "../binary/requests/requests";
import { getTabnineExtensionContext } from "../globals/tabnineExtensionContext";
import { Logger } from "../utils/logger";

const CAPABILITIES_REFRESH_INTERVAL = 10_000; // 10 secs
const TEST_CAPABILITIES_REFRESH_INTERVAL = 5_000; // 5 secs

export enum Capability {
  ON_BOARDING_CAPABILITY = "vscode.onboarding",
  ASSISTANT_CAPABILITY = "vscode.assistant",
  ASSISTANT_MODE_A_CAPABILITY_KEY = "vscode.assistant.mode.A",
  ASSISTANT_MODE_B_CAPABILITY_KEY = "vscode.assistant.mode.B",
  ASSISTANT_BACKGROUND_CAPABILITY = "vscode.assistant.background",
  ASSISTANT_PASTE_CAPABILITY = "vscode.assistant.paste",
  SUGGESTIONS_SINGLE = "suggestions-single",
  SUGGESTIONS_TWO = "suggestions-two",
  SUGGESTIONS_ORIGINAL = "suggestions-original",
  ALPHA_CAPABILITY = "vscode.validator",
  SHOW_AGRESSIVE_STATUS_BAR_UNTIL_CLICKED = "promoteHub1",
  INLINE_SUGGESTIONS = "inline_suggestions_mode",
  SNIPPET_SUGGESTIONS = "snippet_suggestions",
  SNIPPET_SUGGESTIONS_CONFIGURABLE = "snippet_suggestions_configurable",
  VSCODE_INLINE_V2 = "vscode_inline_v2",
  SNIPPET_AUTO_TRIGGER = "snippet_auto_trigger",
  LEFT_TREE_VIEW = "vscode.left_tree_view",
  EMPTY_LINE_SUGGESTIONS = "empty_line_suggestions",
  AUTHENTICATION = "vscode.authentication",
  NOTIFICATIONS_WIDGET = "vscode.notifications-widget",
  TABNINE_TODAY_WIDGET = "vscode.tabnine-today-widget",
  CODE_REVIEW = "vscode.code-review",
  BETA_CAPABILITY = "beta",
  FIRST_SUGGESTION_DECORATION = "first_suggestion_hint_enabled",
  DEBOUNCE_VALUE_300 = "debounce_value_300",
  DEBOUNCE_VALUE_600 = "debounce_value_600",
  DEBOUNCE_VALUE_900 = "debounce_value_900",
  DEBOUNCE_VALUE_1200 = "debounce_value_1200",
  DEBOUNCE_VALUE_1500 = "debounce_value_1500",
  TEST_GEN = "vscode_test_gen",
  FORCE_REGISTRATION = "plugin.feature.force_registration",
  TABNINE_CHAT = "plugin.feature.tabnine_chat",
}

let enabledCapabilities: Record<string, boolean> | null = null;
let isReady = false;

export function isCapabilitiesReady() {
  return isReady;
}

export function isEnabled(capability: Capability): boolean | undefined {
  return enabledCapabilities?.[capability];
}

export function isCapabilityEnabled(capability: Capability): boolean {
  return !!enabledCapabilities?.[capability];
}

export function isAnyCapabilityEnabled(...capabilities: Capability[]): boolean {
  return capabilities.some((capability) => enabledCapabilities?.[capability]);
}

export function getCachedCapabilities(): string[] {
  return Object.keys(enabledCapabilities ?? {});
}

export function fetchCapabilitiesOnFocus(): Promise<void> {
  return new Promise((resolve) => {
    if (vscode.window.state.focused) {
      Logger.log("capabilities resolved immediately");
      resolveCapabilities(resolve);
    } else {
      const disposable = vscode.window.onDidChangeWindowState(({ focused }) => {
        disposable.dispose();
        Logger.log(`capabilities resolved on focus ${focused}`);
        resolveCapabilities(resolve);
      });
    }
  });
}

function resolveCapabilities(resolve: () => void): void {
  void refreshCapabilities().then(() => {
    resolve();
    startRefreshLoop();
  });
}

const capabilitiesRefreshed = new EventEmitter<void>();

export function onDidRefreshCapabilities(listener: () => void): Disposable {
  return capabilitiesRefreshed.event(listener);
}

async function refreshCapabilities(): Promise<void> {
  const capabilities = await getCapabilities();

  const theseCapabilties: Record<string, boolean> = {};
  capabilities?.enabled_features.forEach((feature) => {
    theseCapabilties[feature] = true;
  });

  if (
    !!capabilities &&
    (!capabilities.experiment_source ||
      capabilities.experiment_source === ExperimentSource.API ||
      capabilities.experiment_source === ExperimentSource.APIErrorResponse)
  ) {
    isReady = true;
  }

  enabledCapabilities = theseCapabilties;

  capabilitiesRefreshed.fire(undefined);
}

let interval: NodeJS.Timeout | null = null;

function startRefreshLoop(): void {
  let lastPid = tabNineProcess.pid();
  let lastRefresh = new Date();

  if (interval) {
    clearInterval(interval);
  }

  const refreshInterval =
    getTabnineExtensionContext()?.extensionMode === vscode.ExtensionMode.Test
      ? TEST_CAPABILITIES_REFRESH_INTERVAL
      : CAPABILITIES_REFRESH_INTERVAL;

  interval = setInterval(() => {
    if (
      lastPid !== tabNineProcess.pid() ||
      new Date().getTime() - lastRefresh.getTime() > refreshInterval
    ) {
      void refreshCapabilities();
      lastPid = tabNineProcess.pid();
      lastRefresh = new Date();
    }
  }, 1000);
}
