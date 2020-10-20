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

export type State = {
  cloud_enabled: boolean;
  is_cloud_capable: boolean;
  download_state: {
    status: DownloadStatus;
    last_failure: string;
    kind: DownloadProgress;
  };
  local_enabled: boolean;
  is_cpu_supported: boolean;
  is_authenticated: boolean;
};
