export function versionToBranch(version: string): string {
  return `sb-${version.match(/^\d+.\d+/)[0]}.x`;
}

export function versionToExampleBranch(version: string): string {
  if (version.startsWith("1.5")) {
    return "master";
  }
  return versionToBranch(version);
}
