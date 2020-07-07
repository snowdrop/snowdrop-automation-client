import { logger, RepoRef } from "@atomist/automation-client";
import * as config from "config";
import { latestCommunityTagFinder, latestProdTagFinder } from "../example/tagFinder";
import GitHub from "../github/GitHub";

interface CatalogVersion {
  id: string;
  nameFormat: string;
}

interface CatalogVersions {
  community: CatalogVersion;
  prod: CatalogVersion;
}

export class LauncherCatalogUpdater {
  private github: GitHub;
  private versionsConfig: CatalogVersions;

  constructor(github: GitHub) {
    this.github = github;
    this.versionsConfig = config.get("launcher.catalog.versions");
  }

  public async updateMetadata(content: string, springBootVersion: string): Promise<string> {
    logger.debug("Updating metadata of the catalog");
    const metadata: any = JSON.parse(content);
    const runtime: any = (metadata.runtimes as any[]).find(e => e.id === "spring-boot");
    if (runtime) {
      runtime.versions = [
        {
          id: this.versionsConfig.community.id,
          name: this.versionsConfig.community.nameFormat.replace("${version}", springBootVersion),
        },
        {
          id: this.versionsConfig.prod.id,
          name: this.versionsConfig.prod.nameFormat.replace("${version}", springBootVersion),
        },
      ];
      logger.debug(`Set metadata versions to: ${JSON.stringify(runtime.versions)}`);
      return JSON.stringify(metadata, null, 2);
    }
    return runtime;
  }

  public async updateCatalog(content: string, examples: RepoRef[], springBootVersion: string): Promise<string> {
    logger.debug("Updating catalog entries");
    const catalog: any[] = JSON.parse(content);
    for (const example of examples) {
      await this.updateExample(catalog, example, springBootVersion);
    }
    return JSON.stringify(catalog, null, 2);
  }

  private async updateExample(catalog: any[], example: RepoRef, springBootVersion: string): Promise<void> {
    const tags: string[] = await this.github.getTags(example.repo);
    const communityTag: string = latestCommunityTagFinder.find(tags, springBootVersion);
    if (communityTag) {
      this.updateExampleEntry(catalog, example.url, communityTag, this.versionsConfig.community.id);
    }
    const prodTag: string = latestProdTagFinder.find(tags, springBootVersion);
    if (prodTag) {
      this.updateExampleEntry(catalog, example.url, prodTag, this.versionsConfig.prod.id);
    }
  }

  private updateExampleEntry(catalog: any[], url: string, tag: string, versionId: string) {
    for (const entry of catalog) {
      if (entry.repo === url && entry.metadata.version === versionId) {
        entry.ref = tag;
        logger.debug(`Set ${url} ${versionId} ref to ${tag}`);
      }
    }
  }
}
