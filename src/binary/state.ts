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

export enum OSArchTarget {
  // Partial, has more options.
  APPLE_64 = "x86_64-apple-darwin",
}

export enum Mode {
  // Partial, has more options.
  RELEASE = "Release",
}

export enum EmuMode {
  // Partial, has more options.
  NATIVE = "Native",
}

export enum ServiceLevel {
  // Partial, has more options.
  FREE = "Free",
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
  api_key: string;
  download_state: DownloadState;

  is_lsp_enabled: boolean;
  cloud_enabled: boolean;
  is_cloud_capable: boolean;
  local_enabled: boolean;
  is_cpu_supported: boolean;
  is_authenticated: boolean;
};

export type DownloadState = {
  status: DownloadStatus;
  last_failure: string;
  kind: DownloadProgress;
  crnt_bytes?: number;
  total_bytes?: number;
};
