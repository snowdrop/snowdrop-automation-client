import { RepoRef } from "@atomist/automation-client";
import { expect } from "chai";
import * as config from "config";
import { LauncherCatalogUpdater } from "../../../lib/support/catalog/LauncherCatalogUpdater";
import GitHub from "../../../lib/support/github/GitHub";

class TestGitHub implements GitHub {
  public getTags(repo: string): Promise<string[]> {
    return Promise.resolve(tags);
  }

  public rebase(repo: string, originBranch: string, upstreamBranch: string): Promise<void> {
    return Promise.resolve();
  }

  public raisePullRequest(repo: string, originBranch: string, upstreamBranch: string): Promise<void> {
    return Promise.resolve();
  }
}

describe("LauncherCatalogUpdater", () => {
  const updater: LauncherCatalogUpdater = new LauncherCatalogUpdater(new TestGitHub());

  it("update catalog with current version", async () => {
    const updatedCatalog: any = JSON.parse(await updater.updateCatalog(catalog, examples, "2.2.1.RELEASE"));
    expect(updatedCatalog[0].ref).to.be.equal("2.2.1-1");
    expect(updatedCatalog[1].ref).to.be.equal("2.2.1-1-redhat");
  });

  it("update metadata with current version", async () => {
    const updatedMetadata: any = JSON.parse(await updater.updateMetadata(metadata, "2.2.1.RELEASE"));
    expect(updatedMetadata.runtimes[0].versions[0].name)
      .to.be.equal(versionsConfig.community.nameFormat.replace("${version}", "2.2.1.RELEASE"));
    expect(updatedMetadata.runtimes[0].versions[1].name)
      .to.be.equal(versionsConfig.prod.nameFormat.replace("${version}", "2.2.1.RELEASE"));
  });
});

const versionsConfig: any = config.get("launcher.catalog.versions");

const examples: RepoRef[] = [
  {
    owner: "test-owner",
    repo: "test-repo",
    url: "https://github.com/test-owner/test-repo",
  },
];

const tags: string[] = [
  "2.2.0-1",
  "2.2.0-1-redhat",
  "2.2.1-1",
  "2.2.1-1-redhat",
];

const catalog: string = JSON.stringify(
  [
    {
      repo: "https://github.com/test-owner/test-repo",
      ref: "2.2.0-1",
      metadata: {
        runtime: "spring-boot",
        version: versionsConfig.community.id,
      },
    },
    {
      repo: "https://github.com/test-owner/test-repo",
      ref: "2.2.0-1-redhat",
      metadata: {
        runtime: "spring-boot",
        version: versionsConfig.prod.id,
      },
    },
  ],
);

const metadata: string = JSON.stringify(
  {
    runtimes: [
      {
        id: "spring-boot",
        versions: [
          {
            id: versionsConfig.community.id,
            name: versionsConfig.community.nameFormat.replace("${version}", "2.2.0.RELEASE"),
          },
          {
            id: versionsConfig.prod.id,
            name: versionsConfig.prod.nameFormat.replace("${version}", "2.2.0.RELEASE"),
          },
        ],
      },
    ],
  },
);
