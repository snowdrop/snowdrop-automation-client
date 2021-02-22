import { logger } from "@atomist/automation-client";
import { BOM_VERSION_REGEX, BOOSTER_VERSION_REGEX } from "../../constants";

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

export function bomVersionToSpringBootVersion(bomVersion: string): string {
  if (!BOM_VERSION_REGEX.test(bomVersion)) {
    logger.warn(`Unsupported version format '${bomVersion}'`);
    throw new Error(`Unsupported version format '${bomVersion}'`);
  }
  const matches = bomVersion.match(BOM_VERSION_REGEX);
  if (bomVersion.startsWith("2.3") || bomVersion.startsWith("2.2")) {
    return `${matches[1]}.RELEASE`;
  } else {
    return `${matches[1]}`;
  }
}
