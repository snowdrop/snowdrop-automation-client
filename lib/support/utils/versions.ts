import {logger} from "@atomist/automation-client";
import {BOOSTER_VERSION_REGEX} from "../../constants";

export function versionToBranch(version: string): string {
  const versionRegex = /^\d+.\d+/;
  if (!versionRegex.test(version)) {
    throw new Error(`Unsupported version format '${version}'`);
  }
  return `sb-${version.match(versionRegex)[0]}.x`;
}

export function versionToExampleBranch(version: string): string {
  if (version.startsWith("1.5")) {
    return "master";
  }
  return versionToBranch(version);
}

export function getNextExampleVersion(currentVersion: string): string {
  if (!BOOSTER_VERSION_REGEX.test(currentVersion)) {
    logger.warn(`Unsupported version format '${currentVersion}'`);
    throw new Error(`Unsupported version format '${currentVersion}'`);
  }
  const matches = currentVersion.match(BOOSTER_VERSION_REGEX);
  const currentRevision = matches[2];
  const newRevision = Number(currentRevision) + 1;
  const qualifier = matches[3] ? matches[3] : "";
  return `${matches[1]}-${newRevision}${qualifier}`;
}
