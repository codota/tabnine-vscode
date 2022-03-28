import navigate from "../treeView/navigate";

export async function openLogin(): Promise<void> {
  return navigate("sign_in");
}

export async function openLogout(): Promise<void> {
  return navigate("sign_out");
}
