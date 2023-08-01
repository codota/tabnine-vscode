import { Logger } from "../../utils/logger";
import { tabNineProcess } from "./requests";

export async function getFileMetadata(
  path: string
): Promise<unknown | undefined | null> {
  try {
    const response = await tabNineProcess.request<unknown | undefined | null>({
      FileMetadata: { path },
    });
    return response;
  } catch (error) {
    Logger.error("Failed to get file metadata", error);
  }
  return null;
}
