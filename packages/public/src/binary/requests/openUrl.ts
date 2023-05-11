import { tabNineProcess } from "tabnine-vscode-common";

interface OpenUrlRequest {
  OpenUrl: {
    url: string;
  };
}

interface OpenUrlResult {
  is_opened: boolean;
  is_error: boolean;
}

function openUrl(url: string): Promise<OpenUrlResult | undefined | null> {
  return tabNineProcess.request<OpenUrlResult, OpenUrlRequest>({
    OpenUrl: { url },
  });
}

export default openUrl;
