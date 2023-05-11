export {
  registerSelectionHandling,
  SELECTION_COMPLETED,
  COMPLETION_IMPORTS,
} from "./inlineCompletions/afterSelection/selectionHandler";
export { registerInlineProvider } from "./inlineCompletions/inlineSuggestions/registerInlineProvider";
export { initBinary } from "./binary/requests/requests";
export {
  setBinaryRootPath,
  setBinaryDownloadUrl,
  getActivePath,
  versionPath,
} from "./paths";
export { default as tabnineExtensionProperties } from "./tabnineExtensionProperties";
export { getState } from "./binary/requests/getState";
export { setState, SelectionStateRequest } from "./binary/requests/setState";

export {
  initReporter,
  Reporter,
  report,
  reportErrorEvent,
  reportException,
} from "./reports/reporter";
export { EventName } from "./reports/EventName";

export { LogReporter } from "./reports/LogReporter";

export {
  setTabnineExtensionContext,
  getTabnineExtensionContext,
} from "./tabnineExtensionContext";

export {
  default as runCompletion,
  getLanguageFileExtension,
} from "./runCompletion";

export { tabNineProcess } from "./binary/requests/requests";
export {
  State,
  DownloadProgress,
  DownloadState,
  DownloadStatus,
  ServiceLevel,
} from "./binary/requests/state";

export { TabnineAuthenticationProvider } from "./authentication/TabnineAuthenticationProvider";

// for test
export {
  default as mockedRunProcess,
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
  Item,
  isProcessReadyForTest,
} from "./binary/mockedRunProcess";

export { SuggestionShown } from "./binary/requests/suggestionShown";
export { default as fetchBinaryPath } from "./binaryFetcher";
export { provideInlineCompletionItems } from "./inlineCompletions/provideInlineCompletionItems";
export { TabnineInlineCompletionItem } from "./inlineCompletions/inlineSuggestions/tabnineInlineCompletionItem";
