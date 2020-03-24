import { Project, RepoRef, SimpleProjectEditor } from "@atomist/automation-client";
import { LatestTagRetriever } from "../github/boosterUtils";

export function updateLauncherCatalog(
  latestTagRetriever: LatestTagRetriever, springBootVersion: string, exampleRepos: RepoRef[],
  token?: string): SimpleProjectEditor {

  return async project => {
    await updateCatalogFile(project, exampleRepos, springBootVersion, latestTagRetriever, token);
    await updateMetadataFile(project, springBootVersion);

    return project;
  };
}

async function updateCatalogFile(
  project: Project, exampleRepos: RepoRef[], springBootVersion: string, latestTagRetriever: LatestTagRetriever,
  token?: string) {

  const catalogFile = project.findFileSync("catalog.json");
  const catalog = JSON.parse(catalogFile.getContentSync());
  for (const exampleRepo of exampleRepos) {
    await updateExampleEntries(catalog, exampleRepo, springBootVersion, latestTagRetriever, token);
  }
  catalogFile.setContentSync(JSON.stringify(catalog, null, 2));
}

async function updateExampleEntries(
  catalog: any[], exampleRepo: RepoRef, springBootVersion: string, latestTagRetriever: LatestTagRetriever,
  token?: string) {

  const latestTags = await latestTagRetriever.getLatestTags(exampleRepo.repo, getTagFilter(springBootVersion), token);

  const communityEntry = getCatalogEntry(catalog, exampleRepo.url, getMetadataCommunityVersion(springBootVersion));
  if (latestTags.community && communityEntry) {
    communityEntry.ref = latestTags.community;
  }

  const prodEntry = getCatalogEntry(catalog, exampleRepo.url, getMetadataProdVersion(springBootVersion));
  if (latestTags.prod && prodEntry) {
    prodEntry.ref = latestTags.prod;
  }
}

function getCatalogEntry(catalog: any[], repoUrl: string, metadataVersion: string): any {
  return catalog
    .find(e => e.repo === repoUrl && e.metadata.runtime === "spring-boot" && e.metadata.version === metadataVersion);
}

function getTagFilter(stringBootVersion: string): (tag: string) => boolean {
  const parts = stringBootVersion.match("^\\d+\\.\\d+\\.\\d+");
  const trimmedVersion = (parts != null && parts.length > 0) ? parts[0] : stringBootVersion;

  return tag => tag.startsWith(trimmedVersion);
}

async function updateMetadataFile(project: Project, springBootVersion: string) {
  const metadataFile = project.findFileSync("metadata.json");
  const metadata = JSON.parse(metadataFile.getContentSync());
  const runtimes: any[] = metadata.runtimes;
  const springBootVersions: any[] = runtimes.find(e => e.id === "spring-boot").versions;

  springBootVersions.filter(e => e.id === getMetadataCommunityVersion(springBootVersion))
    .forEach(e => e.name = `${springBootVersion} (Community)`);
  springBootVersions.filter(e => e.id === getMetadataProdVersion(springBootVersion))
    .forEach(e => e.name = `${springBootVersion} (Red Hat Runtimes)`);

  metadataFile.setContent(JSON.stringify(metadata, null, 2));
}

function getMetadataCommunityVersion(springBootVersion: string): string {
  return springBootVersion.startsWith("1.5") ? "previous-community" : "current-community";
}

function getMetadataProdVersion(springBootVersion: string): string {
  return springBootVersion.startsWith("1.5") ? "previous-redhat" : "current-redhat";
}
