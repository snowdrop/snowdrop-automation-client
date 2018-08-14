import * as assert from "power-assert";
import {ApolloGraphClient} from "../../../../node_modules/@atomist/automation-client/graph/ApolloGraphClient";
import {InMemoryProject} from "../../../../node_modules/@atomist/automation-client/project/mem/InMemoryProject";
import {BoosterTagTuple, LatestTagRetriever} from "../../../../src/support/github/boosterUtils";
import {updateLauncherCatalog} from "../../../../src/support/transform/catalog/updateLauncherCatalog";
import {githubToken, SlackTeamId} from "../../../github";

const sbVersionOfLatestTags = "1.5.25";
const qualifierOfLatestCommunityTag = "10";
const qualifierOfLatestProdTag = "9";
const currentCommunityTagInConfig = "current";
const currentProdTagConfig = "current-redhat";

describe("updateLauncherCatalogTest", () => {

  const graphClient = new ApolloGraphClient(`https://automation.atomist.com/graphql/team/${SlackTeamId}`,
      { Authorization: `token ${githubToken()}` });

  it("doesn't update files when tags don't match", async () => {
    const project = createProject();
    await updateLauncherCatalog(
        { graphClient, teamId: SlackTeamId } as any,
        new DummyLatestTagRetriever(),
        "dummy",
        githubToken(),
    )(project);

    const cacheCommunityContent =
        project.findFileSync("spring-boot/current-community/cache/booster.yaml").getContentSync();
    assert(cacheCommunityContent === createConfiguration("cache", currentCommunityTagInConfig));

    const cacheProdContent =
        project.findFileSync("spring-boot/current-redhat/cache/booster.yaml").getContentSync();
    assert(cacheProdContent === createConfiguration("cache", currentProdTagConfig));

    const istioCBCommunityContent =
        project
        .findFileSync("spring-boot/current-community/istio-circuit-breaker/booster.yaml")
        .getContentSync();
    assert(istioCBCommunityContent === createConfiguration("istio-circuit-breaker", currentCommunityTagInConfig));

    const istioCBProdContent =
        project
        .findFileSync("spring-boot/current-redhat/istio-circuit-breaker/booster.yaml")
        .getContentSync();
    assert(istioCBProdContent === createConfiguration("istio-circuit-breaker", currentProdTagConfig));
  }).timeout(20000);

  it("correctly update file when matching tags exist", async () => {
    const project = createProject();
    await updateLauncherCatalog(
        { graphClient, teamId: SlackTeamId } as any,
        new DummyLatestTagRetriever(),
        sbVersionOfLatestTags,
        githubToken(),
    )(project);

    const cacheCommunityContent =
        project.findFileSync("spring-boot/current-community/cache/booster.yaml").getContentSync();
    assert(cacheCommunityContent === createConfiguration(
        "cache",
        `${sbVersionOfLatestTags}-${qualifierOfLatestCommunityTag}`,
    ));

    const cacheProdContent =
        project.findFileSync("spring-boot/current-redhat/cache/booster.yaml").getContentSync();
    assert(cacheProdContent === createConfiguration(
        "cache",
        `${sbVersionOfLatestTags}-${qualifierOfLatestProdTag}-redhat`,
    ));

    const httpCommunityContent =
        project.findFileSync("spring-boot/current-community/rest-http/booster.yaml").getContentSync();
    assert(httpCommunityContent === createConfiguration(
        "http",
        `${sbVersionOfLatestTags}-${qualifierOfLatestCommunityTag}`,
    ));

    const httpProdContent =
        project.findFileSync("spring-boot/current-redhat/rest-http/booster.yaml").getContentSync();
    assert(httpProdContent === createConfiguration(
        "http",
        `${sbVersionOfLatestTags}-${qualifierOfLatestProdTag}-redhat`,
    ));

    const istioCBCommunityContent =
        project
          .findFileSync("spring-boot/current-community/istio-circuit-breaker/booster.yaml")
          .getContentSync();
    assert(istioCBCommunityContent ===
        createConfiguration(
            "istio-circuit-breaker",
            `${sbVersionOfLatestTags}-${qualifierOfLatestCommunityTag}`,
        ));

    const istioCBProdContent =
        project
          .findFileSync("spring-boot/current-redhat/istio-circuit-breaker/booster.yaml")
          .getContentSync();
    assert(istioCBProdContent ===
        createConfiguration(
            "istio-circuit-breaker",
            `${sbVersionOfLatestTags}-${qualifierOfLatestProdTag}-redhat`,
        ));
  }).timeout(20000);

});

function createProject() {
  return InMemoryProject.of(
      {
        path: "spring-boot/current-community/cache/booster.yaml",
        content: createConfiguration("cache", currentCommunityTagInConfig),
      },
      {
        path: "spring-boot/current-redhat/cache/booster.yaml",
        content: createConfiguration("cache", currentProdTagConfig),
      },
      {
        path: "spring-boot/current-community/rest-http/booster.yaml",
        content: createConfiguration("http", currentCommunityTagInConfig),
      },
      {
        path: "spring-boot/current-redhat/rest-http/booster.yaml",
        content: createConfiguration("http", currentProdTagConfig),
      },
      {
        path: "spring-boot/current-community/istio-circuit-breaker/booster.yaml",
        content: createConfiguration("istio-circuit-breaker", currentCommunityTagInConfig),
      },
      {
        path: "spring-boot/current-redhat/istio-circuit-breaker/booster.yaml",
        content: createConfiguration("istio-circuit-breaker", currentProdTagConfig),
      },
  );
}

function createConfiguration(name: string, tag: string): string {
  return `
metadata:
  app:
    launcher:
      runsOn:
      - '!starter'
name: ${name}
description: Whatever
source:
  git:
    url: https://github.com/snowdrop/${name}
    ref: ${tag}
`;
}

class DummyLatestTagRetriever implements LatestTagRetriever {

  public async getLatestTags(booster: string,
                             tagFilter?: (t: string) => boolean,
                             token?: string): Promise<BoosterTagTuple> {

    const community
        = `${sbVersionOfLatestTags}-${qualifierOfLatestCommunityTag}`;
    const prod
        = `${sbVersionOfLatestTags}-${qualifierOfLatestProdTag}-redhat`;
    return {
      community: this.valueOrUndefined(community, tagFilter),
      prod: this.valueOrUndefined(prod, tagFilter),
    };
  }

  private valueOrUndefined(tag: string, tagFilter?: (t: string) => boolean) {
    if (!tagFilter) {
      return tag;
    }
    return tagFilter(tag) ? tag : undefined;
  }
}
