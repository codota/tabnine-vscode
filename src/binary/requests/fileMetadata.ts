import { tabNineProcess } from "./requests";

export async function getFileMetadata(path: string): Promise<any> {
    const response = await tabNineProcess.request<any>({ FileMetadata: { path } });

    if (response.error) {
        console.error('Failed to get file metadata', response);
        return null;
    }

    return response;
}