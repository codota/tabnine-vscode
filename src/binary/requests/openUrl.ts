import { tabNineProcess } from "./requests";
import {isSandboxed} from "../../sandbox";

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
  if (isSandboxed()) {
    return Promise.reject("Sandboxed plugin will not open urls");
  }
  return tabNineProcess.request<OpenUrlResult, OpenUrlRequest>({
    OpenUrl: { url },
  });
}

export default openUrl;
