import axios from "axios";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";

const instance = axios.create({
  baseURL: tabnineExtensionProperties.searchBaseUrl,
  timeout: 30000,
});

export interface SearchRequest {
  text: string | undefined;
}

export type SearchResponse = string[];

export async function search(payload: SearchRequest): Promise<SearchResponse> {
  return (await instance.post<SearchResponse>("search", payload)).data;
}
