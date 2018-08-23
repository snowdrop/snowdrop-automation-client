import * as yaml from "js-yaml";
import * as _ from "lodash";
import * as assert from "power-assert";
import {BoosterTagTuple, LatestTagRetriever} from "../../../../lib/support/github/boosterUtils";
import {updateLauncherCatalog} from "../../../../lib/support/transform/catalog/updateLauncherCatalog";
import {ApolloGraphClient} from "../../../../node_modules/@atomist/automation-client/graph/ApolloGraphClient";
import {InMemoryProject} from "../../../../node_modules/@atomist/automation-client/project/mem/InMemoryProject";
import {githubToken, SlackTeamId} from "../../../github";

const sbVersionOfLatestTags = "1.5.25";
const qualifierOfLatestCommunityTag = "10";
const qualifierOfLatestProdTag = "9";
const currentCommunityTagInConfig = "current";
const currentProdTagConfig = "current-redhat";
const currentSbVersionInMetadata = "1.5.14";

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
    assert(cacheCommunityContent === createBoosterConfiguration("cache", currentCommunityTagInConfig));

    const cacheProdContent =
        project.findFileSync("spring-boot/current-redhat/cache/booster.yaml").getContentSync();
    assert(cacheProdContent === createBoosterConfiguration("cache", currentProdTagConfig));

    const istioCBCommunityContent =
        project
        .findFileSync("spring-boot/current-community/istio-circuit-breaker/booster.yaml")
        .getContentSync();
    assert(istioCBCommunityContent ===
        createBoosterConfiguration("istio-circuit-breaker", currentCommunityTagInConfig));

    const istioCBProdContent =
        project
        .findFileSync("spring-boot/current-redhat/istio-circuit-breaker/booster.yaml")
        .getContentSync();
    assert(istioCBProdContent === createBoosterConfiguration("istio-circuit-breaker", currentProdTagConfig));
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
    assert(cacheCommunityContent === createBoosterConfiguration(
        "cache",
        `${sbVersionOfLatestTags}-${qualifierOfLatestCommunityTag}`,
    ));

    const cacheProdContent =
        project.findFileSync("spring-boot/current-redhat/cache/booster.yaml").getContentSync();
    assert(cacheProdContent === createBoosterConfiguration(
        "cache",
        `${sbVersionOfLatestTags}-${qualifierOfLatestProdTag}-redhat`,
    ));

    const httpCommunityContent =
        project.findFileSync("spring-boot/current-community/rest-http/booster.yaml").getContentSync();
    assert(httpCommunityContent === createBoosterConfiguration(
        "http",
        `${sbVersionOfLatestTags}-${qualifierOfLatestCommunityTag}`,
    ));

    const httpProdContent =
        project.findFileSync("spring-boot/current-redhat/rest-http/booster.yaml").getContentSync();
    assert(httpProdContent === createBoosterConfiguration(
        "http",
        `${sbVersionOfLatestTags}-${qualifierOfLatestProdTag}-redhat`,
    ));

    const istioCBCommunityContent =
        project
          .findFileSync("spring-boot/current-community/istio-circuit-breaker/booster.yaml")
          .getContentSync();
    assert(istioCBCommunityContent ===
        createBoosterConfiguration(
            "istio-circuit-breaker",
            `${sbVersionOfLatestTags}-${qualifierOfLatestCommunityTag}`,
        ));

    const istioCBProdContent =
        project
          .findFileSync("spring-boot/current-redhat/istio-circuit-breaker/booster.yaml")
          .getContentSync();
    assert(istioCBProdContent ===
        createBoosterConfiguration(
            "istio-circuit-breaker",
            `${sbVersionOfLatestTags}-${qualifierOfLatestProdTag}-redhat`,
        ));

    const newMetadataContent = project.findFileSync("metadata.yaml").getContentSync();
    const oldMetadataContent = createMetadata(sbVersionOfLatestTags);
    // make sure that structurally the yaml is the same
    // there are definitely differences in the new lines and whitespaces, but we don't care about them
    assert(_.isEqual(yaml.load(newMetadataContent), yaml.load(oldMetadataContent)));

  }).timeout(20000);

});

function createProject() {
  return InMemoryProject.of(
      {
        path: "spring-boot/current-community/cache/booster.yaml",
        content: createBoosterConfiguration("cache", currentCommunityTagInConfig),
      },
      {
        path: "spring-boot/current-redhat/cache/booster.yaml",
        content: createBoosterConfiguration("cache", currentProdTagConfig),
      },
      {
        path: "spring-boot/current-community/rest-http/booster.yaml",
        content: createBoosterConfiguration("http", currentCommunityTagInConfig),
      },
      {
        path: "spring-boot/current-redhat/rest-http/booster.yaml",
        content: createBoosterConfiguration("http", currentProdTagConfig),
      },
      {
        path: "spring-boot/current-community/istio-circuit-breaker/booster.yaml",
        content: createBoosterConfiguration("istio-circuit-breaker", currentCommunityTagInConfig),
      },
      {
        path: "spring-boot/current-redhat/istio-circuit-breaker/booster.yaml",
        content: createBoosterConfiguration("istio-circuit-breaker", currentProdTagConfig),
      },
      {
         path: "metadata.yaml",
         content: createMetadata(currentSbVersionInMetadata),
      },
  );
}

function createBoosterConfiguration(name: string, tag: string): string {
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

/* tslint:disable */

function createMetadata(sbVersion: string): string {
  return `
missions:
- id: cache
  name: Cache
  description: Use a cache to improve the response time of applications
  metadata:
    level: advanced
runtimes:
- id: vert.x
  name: Eclipse Vert.x
  description: A tool-kit for building reactive applications on the JVM.
  icon: data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 640 280'%3E%3Cpath fill='%23022B37' d='M107 170.8L67.7 72H46.9L100
    204h13.9L167 72h-20.4zm64 33.2h80v-20h-61v-37h60v-19h-60V91h61V72h-80zm180.1-90.7c0-21-14.4-42.3-43.1-42.3h-48v133h19V91h29.1c16.1
    0 24 11.1 24 22.4 0 11.5-7.9 22.6-24 22.6H286v9.6l48 58.4h24.7L317 154c22.6-4
    34.1-22 34.1-40.7m56.4 90.7v-1c0-6 1.7-11.7 4.5-16.6V91h39V71h-99v20h41v113h14.5z'/%3E%3Cpath
    fill='%23623C94' d='M458 203c0-9.9-8.1-18-18-18s-18 8.1-18 18 8.1 18 18 18 18-8.1
    18-18M577.4 72h-23.2l-27.5 37.8L499.1 72h-40.4c12.1 16 33.6 46.8 47.8 66.3l-37
    50.9c2 4.2 3.1 8.9 3.1 13.8v1H499l95.2-132h-16.8zm-19.7 81.5l-20.1 27.9 16.5 22.6h40.2c-9.6-13.7-24-33.3-36.6-50.5z'/%3E%3C/svg%3E
  metadata:
    pipelinePlatform: maven
  versions:
  - id: redhat
    name: 3.5.3.redhat-00001 (RHOAR)
  - id: community
    name: 3.5.3.Final (Community)
- id: spring-boot
  name: Spring Boot
  description: Create stand-alone, production-grade Spring based Applications that
    you can "just run".
  icon: data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg'
    width='205.3' height='184.28'%3E%3Cpath fill='%2368bd45' d='M202.66 81.08l-40.43-70C158.72
    5 150.1 0 143.08 0H62.22c-7 0-15.64 5-19.15 11.06l-40.43 70c-3.52 6.08-3.52 16
    0 22.12l40.43 70c3.51 6.08 12.13 11.06 19.15 11.06h80.86c7 0 15.63-5 19.15-11.06l40.43-70c3.52-6.07
    3.52-16.01 0-22.1zM93.91 38.72a8.34 8.34 0 1 1 16.67 0v49.81a8.34 8.34 0 1 1-16.67
    0zM102.25 145A56.51 56.51 0 0 1 68.54 43.17a7.41 7.41 0 1 1 8.85 11.89 41.69 41.69
    0 1 0 66.54 33.47A41.89 41.89 0 0 0 127 55a7.41 7.41 0 0 1 8.76-12 56.52 56.52
    0 0 1-33.51 102z'/%3E%3C/svg%3E
  metadata:
    pipelinePlatform: maven
  versions:
  - id: current-community
    name: ${sbVersion}.RELEASE (Community)
  - id: current-redhat
    name: ${sbVersion}.RELEASE (RHOAR)
  - id: current-osio
    name: 1.5.12.RELEASE (OSIO)
- id: thorntail
  name: Thorntail
  description: An innovative approach to packaging and running Java EE applications,
    packaging them with just enough of the server runtime to "java -jar" your application.
  icon: data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg'
    id='Layer_1' version='1' viewBox='0 0 128 128'%3E%3Cstyle%3E.st1{fill:%23f7931e}.st2{fill:%23585858}%3C/style%3E%3Cpath
    fill='%23333' d='M112.4 127.9H15.7c-8.6 0-15.6-7-15.6-15.6V15.6C.1 7 7.1 0 15.7
    0h96.7C121 0 128 7 128 15.6v96.7c0 8.7-7 15.6-15.6 15.6z'/%3E%3Cpath d='M103.3
    71.5L70.5 57.7c-.5-.2-.3-.9.2-.8l35.1 6.4c.3 0 .4.3.3.5l-2.2 7.5c-.1.2-.3.3-.6.2z'
    class='st1'/%3E%3Cpath d='M120.6 53.6L72 53.5c-.5 0-.6-.7-.1-.8L118.5 39c.3-.1.5.1.5.4l1.9
    13.7c.1.2-.1.5-.3.5z' class='st2'/%3E%3Cpath d='M24.8 71.2l32.8-13.8c.5-.2.3-.9-.2-.8L22.3
    63c-.3 0-.4.3-.3.5l2.2 7.5c.1.2.4.3.6.2z' class='st1'/%3E%3Cpath d='M7.6 53.6l48.6-.1c.5
    0 .6-.7.1-.8L9.6 39c-.3-.1-.5.1-.5.4l-2 13.7c0 .2.2.5.5.5z' class='st2'/%3E%3Cpath
    d='M64.3 78.1l2.1-1.1-1.9 11.6c-.1.5-.8.5-.8 0L61.8 77l2.1 1.1c.1.1.2.1.4 0z'
    class='st1'/%3E%3Cpath d='M60.6 68.8l-.1.1-.1-.2zm7.1-.1v.2l-.1-.1z'/%3E%3Cpath
    d='M63.9 44.9l-6.5 3.4c-.2.1-.2.5 0 .6l6.5 3.4c.1.1.2.1.3 0l6.5-3.4c.2-.1.2-.5
    0-.6l-6.5-3.4c-.1-.1-.2-.1-.3 0zm5 16.2c0 .1 0 .1 0 0l-.1.8-.2 1.5-.6 3.5-2 1-1.6.8-.1.1c-.1.1-.3.1-.4
    0l-.1-.1-1.6-.7-2-1-.6-3.5-.2-1.5-.1-.7v-.1l.8.4 1.6.8 2.3 1.2c.1.1.3.1.4 0l2.3-1.2
    1.6-.8.6-.5z' class='st1'/%3E%3Cpath d='M67.7 68.9l-.2 1.5-.8 4.8-2.4 1.2c-.1.1-.3.1-.4
    0l-2.4-1.2-.8-4.8-.2-1.5.1-.1 1.6.8 1.7.9c.1.1.3.1.4 0l1.7-.9 1.6-.8.1.1z' class='st2'/%3E%3C/svg%3E
  metadata:
    pipelinePlatform: maven
  versions:
  - id: community
    name: 2.0.0.Final (Community)
`;
}

/* tslint:enable */

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
