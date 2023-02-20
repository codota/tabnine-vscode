// set by webpack build plugin
declare const __ONPREM__: boolean | null | undefined;
export const ONPREM = typeof __ONPREM__ === "boolean" && __ONPREM__;

console.log("ONPREM is ", ONPREM);
