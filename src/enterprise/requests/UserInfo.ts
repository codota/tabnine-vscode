import { tabNineProcess } from "../../binary/requests/requests";

type KnownScopes = "chat" | "completions";

export type UserInfo = {
  email: string;
  team: [];
  verified: [];
  isLoggedIn: boolean;
  scopes?: KnownScopes[];
};

export default function getUserInfo(): Promise<UserInfo | null | undefined> {
  return tabNineProcess.request({ UserInfo: {} });
}
