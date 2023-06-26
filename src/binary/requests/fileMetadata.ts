/* eslint-disable 
     @typescript-eslint/no-explicit-any, 
     @typescript-eslint/no-unsafe-assignment, 
     @typescript-eslint/no-unsafe-member-access, 
     @typescript-eslint/no-unsafe-return
*/

import { tabNineProcess } from "./requests";

export async function getFileMetadata(path: string): Promise<unknown> {
  const response = await tabNineProcess.request<any>({
    FileMetadata: { path },
  });

  if (response.error) {
    console.error("Failed to get file metadata", response);
    return null;
  }

  return response;
}
