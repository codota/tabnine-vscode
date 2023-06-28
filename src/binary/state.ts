export enum DownloadStatus {
  FINISHED = "Finished",
  NOT_STARTED = "NotStarted",
  IN_PROGRESS = "InProgress",
}

export enum DownloadProgress {
  DOWNLOADING = "Downloading",
  RETRIEVING_METADATA = "RetrievingMetadata",
  VERIFYING_CHECKSUM = "VerifyingChecksum",
}

enum OSArchTarget {
  // Partial, has more options.
  APPLE_64 = "x86_64-apple-darwin",
}

enum Mode {
  // Partial, has more options.
  RELEASE = "Release",
}

enum EmuMode {
  // Partial, has more options.
  NATIVE = "Native",
}

export type ServiceLevel =
  | "Free"
  | "Pro"
  | "Trial"
  | "Trial Expired"
  | "Lite"
  | "Business";

export type DownloadState = {
  status: DownloadStatus;
  last_failure: string;
  kind: DownloadProgress;
  crnt_bytes?: number;
  total_bytes?: number;
};

export interface ProcessState {
  globalRestartStatus: {
    [processId: string]: {
      setOn: string;
      restartOn: string | null;
      value: "evaluating" | "planned" | "notPlanned";
    };
  } | null;
}

export type State = {
  version: string; // semver compatible version
  target: OSArchTarget;
  settings: {
    mode: Mode;
    emu_mode: EmuMode;
    additional_file_size_limit: null;
    drop_timeout: {
      secs: number;
      nanos: number;
    };
    non_modern_ide: boolean;
  };
  service_level: ServiceLevel;
  language: string;
  api_key?: string;
  download_state: DownloadState;

  is_lsp_enabled: boolean;
  cloud_enabled: boolean;
  is_cloud_capable: boolean;
  local_enabled: boolean;
  is_cpu_supported: boolean;
  is_authenticated: boolean;
  is_logged_in: boolean;
  user_name: string;
  process_state?: ProcessState;
  enabled_features?: string[];
  installation_time?: string;
  access_token?: string;
  cloud_connection_health_status?: string;
  user_avatar_url?: string;
};
