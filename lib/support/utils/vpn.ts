import * as dns from "dns";
import {promisify} from "util";

// For some reason, on MacOSX we need to use dns.lookup instead of dns.resolve
const dnsFunctionToUse = (process.platform === "darwin" ? dns.lookup : dns.resolve);

export async function isOnVpn(): Promise<boolean> {
  try {
    await promisify(dnsFunctionToUse)("indy.psi.redhat.com");
    return true;
  } catch (e) {
    return false;
  }
}
