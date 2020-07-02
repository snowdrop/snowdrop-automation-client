export interface LatestTagFinder {
  find(tags: string[], springBootVersion: string): string | null;
}

export const latestCommunityTagFinder = {
  find(tags: string[], springBootVersion: string): string | null {
    const tagRegex = new RegExp(`^${trimSpringBootVersion(springBootVersion)}-[0-9]+$`, "g");
    const incrementRegex = /-([0-9]+)$/;
    return getLatestTag(tags, tagRegex, incrementRegex);
  },
} as LatestTagFinder;

export const latestProdTagFinder = {
  find(tags: string[], springBootVersion: string): string | null {
    const tagRegex = new RegExp(`^${trimSpringBootVersion(springBootVersion)}-[0-9]+-redhat$`, "g");
    const incrementRegex = /-([0-9]+)-redhat$/;
    return getLatestTag(tags, tagRegex, incrementRegex);
  },
} as LatestTagFinder;

function getLatestTag(tags: string[], tagRegex: RegExp, incrementRegex: RegExp): string {
  const sorted: string[] = tags
    .filter(t => tagRegex.test(t))
    .sort((a, b) => parseInt(b.match(incrementRegex)[1], 10) - parseInt(a.match(incrementRegex)[1], 10));

  return sorted.length > 0 ? sorted[0] : null;
}

function trimSpringBootVersion(springBootVersion: string): string {
  if (springBootVersion.endsWith(".RELEASE")) {
    return springBootVersion.substr(0, springBootVersion.length - 8);
  }
  return springBootVersion;
}
