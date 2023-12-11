import { tabNineProcess } from "../../binary/requests/requests";

export type UserInfo = {
  email: string;
  team: {
    id: string;
    name: string;
  } | null;
  verified: boolean;
  isLoggedIn: boolean;
};
export default function getUserInfo(): Promise<UserInfo | null | undefined> {
  return tabNineProcess.request({ UserInfo: {} }, 5_000);
}
