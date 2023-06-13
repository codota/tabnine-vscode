import { tabNineProcess } from "../../binary/requests/requests";

export type UserInfo = {
  email: string;
  team: [];
  verified: [];
  isLoggedIn: boolean;
};
export default function getUserInfo(): Promise<UserInfo | null | undefined> {
  return tabNineProcess.request({ UserInfo: {} });
}
