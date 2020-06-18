import { InMemoryProject, Project, RepoRef } from "@atomist/automation-client";
import * as _ from "lodash";
import * as assert from "power-assert";
import { updateLauncherCatalog } from "../../../lib/support/catalog/updateLauncherCatalog";
import { BoosterTagTuple, LatestTagRetriever } from "../../../lib/support/github/boosterUtils";
import { githubToken } from "../../tokens";

describe("updateLauncherCatalogTest", () => {

  const PREVIOUS_COMMUNITY_TAG = "1.5.0-1";
  const PREVIOUS_PROD_TAG = "1.5.0-1-redhat";
  const PREVIOUS_SPRING_BOOT_VERSION = "1.5.0.RELEASE";

  const CURRENT_COMMUNITY_TAG = "2.0.0-1";
  const CURRENT_PROD_TAG = "2.0.0-1-redhat";
  const CURRENT_SPRING_BOOT_VERSION = "2.0.0.RELEASE";

  it("update from 2.0.0 to 2.0.1", async () => {
    const updatedCommunityTag = "2.0.1-1";
    const updatedProdTag = "2.0.1-2-redhat";
    const updatedSpringBootVersion = "2.0.1.RELEASE";

    const project = createProject(
      createCatalog(PREVIOUS_COMMUNITY_TAG, PREVIOUS_PROD_TAG, CURRENT_COMMUNITY_TAG, CURRENT_PROD_TAG),
      createMetadata(PREVIOUS_SPRING_BOOT_VERSION, CURRENT_SPRING_BOOT_VERSION),
    );

    const tagRetriever = new DummyLatestTagRetriever(updatedCommunityTag, updatedProdTag);
    await updateLauncherCatalog(tagRetriever, updatedSpringBootVersion, getExampleRepos(), githubToken())(project);

    assertCatalog(project, PREVIOUS_COMMUNITY_TAG, PREVIOUS_PROD_TAG, updatedCommunityTag, updatedProdTag);
    assertMetadata(project, PREVIOUS_SPRING_BOOT_VERSION, updatedSpringBootVersion);
  }).timeout(20000);

  it("update from 1.5.0 to 1.5.1", async () => {
    const updatedCommunityTag = "1.5.1-1";
    const updatedProdTag = "1.5.1-2-redhat";
    const updatedSpringBootVersion = "1.5.1.RELEASE";

    const project = createProject(
      createCatalog(PREVIOUS_COMMUNITY_TAG, PREVIOUS_PROD_TAG, CURRENT_COMMUNITY_TAG, CURRENT_PROD_TAG),
      createMetadata(PREVIOUS_SPRING_BOOT_VERSION, CURRENT_SPRING_BOOT_VERSION),
    );

    const tagRetriever = new DummyLatestTagRetriever(updatedCommunityTag, updatedProdTag);
    await updateLauncherCatalog(tagRetriever, updatedSpringBootVersion, getExampleRepos(), githubToken())(project);

    assertCatalog(project, updatedCommunityTag, updatedProdTag, CURRENT_COMMUNITY_TAG, CURRENT_PROD_TAG);
    assertMetadata(project, updatedSpringBootVersion, CURRENT_SPRING_BOOT_VERSION);
  }).timeout(20000);
});

function assertCatalog(
  project: Project, previousCommunityTag: string, previousProdTag: string, currentCommunityTag: string,
  currentProdTag: string) {

  const catalog: any[] = JSON.parse(project.findFileSync("catalog.json").getContentSync());

  const previsouCommunity = catalog.find(e => e.metadata.version === "previous-community");
  assert(previsouCommunity.ref === previousCommunityTag);

  const previsouProd = catalog.find(e => e.metadata.version === "previous-redhat");
  assert(previsouProd.ref === previousProdTag);

  const currentCommunity = catalog.find(e => e.metadata.version === "current-community");
  assert(currentCommunity.ref === currentCommunityTag);

  const currentProd = catalog.find(e => e.metadata.version === "current-redhat");
  assert(currentProd.ref === currentProdTag);
}

function assertMetadata(project: Project, previousSpringBootVersion: string, currentSpringBootVersion: string) {
  const metadata: any = JSON.parse(project.findFileSync("metadata.json").getContentSync());
  const runtimes: any[] = metadata.runtimes;
  const versions: any[] = runtimes.find(e => e.id === "spring-boot").versions;

  assert(versions.find(e => e.id === "previous-community").name === `${previousSpringBootVersion} (Community)`);
  assert(versions.find(e => e.id === "previous-redhat").name === `${previousSpringBootVersion} (Red Hat Runtimes)`);
  assert(versions.find(e => e.id === "current-community").name === `${currentSpringBootVersion} (Community)`);
  assert(versions.find(e => e.id === "current-redhat").name === `${currentSpringBootVersion} (Red Hat Runtimes)`);
}

function getExampleRepos(): RepoRef[] {
  return [
    {
      owner: "snowdrop",
      repo: "rest-http-example",
      url: "https://github.com/snowdrop/rest-http-example",
    },
  ];
}

function createProject(catalog: string, metadata: string) {
  return InMemoryProject.of(
    {
      path: "catalog.json",
      content: catalog,
    },
    {
      path: "metadata.json",
      content: metadata,
    },
  );
}

function createCatalog(
  previousTag: string, previousProdTag: string, currentTag: string, currentProdTag: string): string {

  return JSON.stringify(
    [
      {
        name: "Spring Boot - HTTP Example",
        description: "Booster to expose a HTTP Greeting endpoint using Spring Boot and Apache Tomcat in embedded mode.",
        repo: "https://github.com/snowdrop/rest-http-example",
        ref: previousTag,
        metadata: {
          mission: "rest-http",
          runtime: "spring-boot",
          version: "previous-community",
        },
      },
      {
        name: "Spring Boot - HTTP Example",
        description: "Booster to expose a HTTP Greeting endpoint using Spring Boot and Apache Tomcat in embedded mode.",
        repo: "https://github.com/snowdrop/rest-http-example",
        ref: previousProdTag,
        metadata: {
          mission: "rest-http",
          runtime: "spring-boot",
          version: "previous-redhat",
        },
      },
      {
        name: "Spring Boot - HTTP Example",
        description: "Booster to expose a HTTP Greeting endpoint using Spring Boot and Apache Tomcat in embedded mode.",
        repo: "https://github.com/snowdrop/rest-http-example",
        ref: currentTag,
        metadata: {
          mission: "rest-http",
          runtime: "spring-boot",
          version: "current-community",
        },
      },
      {
        name: "Spring Boot - HTTP Example",
        description: "Booster to expose a HTTP Greeting endpoint using Spring Boot and Apache Tomcat in embedded mode.",
        repo: "https://github.com/snowdrop/rest-http-example",
        ref: currentProdTag,
        metadata: {
          mission: "rest-http",
          runtime: "spring-boot",
          version: "current-redhat",
        },
      },
    ],
  );
}

/* tslint:disable */

function createMetadata(previousSpringBootVersion: string, currentSpringBootVersion: string): string {
  return JSON.stringify(
    {
      "missions": [
        {
          "id": "rest-http",
          "name": "REST API Level 0",
          "description": "Map business operations to a remote procedure call endpoint over HTTP\nusing a REST framework",
          "metadata": {
            "level": "foundational"
          }
        },
        {
          "id": "health-check",
          "name": "Health Check",
          "description": "Monitor an application's ability to service requests",
          "metadata": {
            "level": "foundational"
          }
        }
      ],
      "runtimes": [
        {
          "id": "spring-boot",
          "name": "Spring Boot",
          "description": "Create stand-alone, production-grade Spring based Applications that you can \"just run\".",
          "icon": "data:image/svg+xml,%3Csvg id='Layer_1' data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1000'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23153d3c;%7D.cls-2%7Bfill:%23d8da9d;%7D.cls-3%7Bfill:%2358c0a8;%7D.cls-4%7Bfill:%23fff;%7D.cls-5%7Bfill:%233d9191;%7D%3C/style%3E%3C/defs%3E%3Ctitle%3Esnowdrop_logo_rgb_vertical_default%3C/title%3E%3Cpath class='cls-1' d='M943.41,430.58c-9.58-32.79-26.75-62.88-51-89.43-8.19-9.73-20-24.38-33.66-41.31C789,213.44,713.07,121.45,651.59,65.23q-6.52-6.81-13.48-13a213.73,213.73,0,0,0-31.5-23.09A157.42,157.42,0,0,0,589.12,19,173.77,173.77,0,0,0,551.91,6.1,134.33,134.33,0,0,0,525.8,1.7C520,1.11,515.68,1,513.4,1h-2.8a151.87,151.87,0,0,0-27.37,2.89A179.31,179.31,0,0,0,434.88,19a157.09,157.09,0,0,0-17.47,10.13A213.59,213.59,0,0,0,385.9,52.23c-4.65,4.11-9.14,8.47-13.51,13C310.92,121.46,235,213.44,165.27,299.84c-13.66,16.93-25.47,31.58-33.66,41.31-24.27,26.55-41.44,56.64-51,89.43-9.12,31.24-11.23,64.39-6.26,98.53,9.42,64.77,44.58,130.8,99,185.91a19,19,0,0,0,13.43,5.62h1.58l1.61-.27c69.85-12,94.77-68.57,123.63-134.07,3.37-7.65,6.85-15.56,10.51-23.63q4.67,7.33,9.82,14c27.43,35.25,64.72,55.72,114,62.58l16.2,2.25,4.27-15.79c11.42-42.28,30.41-78.27,43.63-100.11,13.22,21.83,32.21,57.83,43.63,100.11l4.27,15.79,16.2-2.25c49.28-6.86,86.57-27.33,114-62.58q5.16-6.63,9.82-14c3.66,8.07,7.14,16,10.51,23.63,28.86,65.5,53.78,122.08,123.63,134.07l1.55.26h1.64A19,19,0,0,0,850.68,715c54.41-55.11,89.57-121.14,99-185.91C954.64,495,952.53,461.82,943.41,430.58Z'/%3E%3Cpath class='cls-2' d='M384.61,79.27c15.41-14.13,29.9-26,42.88-34.57A182.73,182.73,0,0,1,484.3,22.54a143.67,143.67,0,0,1,55.24,0c3.87.79,8.06,1.78,12.51,3C604.11,43.2,625.23,104,511.19,239.29,486.41,268.68,390,407.16,352.07,470.57a544.29,544.29,0,0,0-28.62,50.24c-14.79-36.49-23.93-85.9-23.93-152.85C299.52,213.15,339.4,127.09,384.61,79.27Z'/%3E%3Cpath class='cls-3' d='M525.39,251.25c72.42-85.91,100-152.75,82-198.81,10,7.49,20.73,16.54,31.94,26.82,45.21,47.82,85.11,133.88,85.11,288.7,0,67-9.14,116.36-23.93,152.85a542.16,542.16,0,0,0-28.63-50.24c-33.6-56.24-113.27-171.51-148.14-217.37C524.35,252.51,524.89,251.84,525.39,251.25Z'/%3E%3Cpath class='cls-4' d='M186.81,702.08h-.06a.33.33,0,0,1-.23-.09c-103-104.32-133.59-247.63-41-348.6C175.4,318,249,222.77,320.25,144.71c-2.69,6.07-5.27,12.29-7.68,18.69C291.6,218.93,281,287.76,281,368c0,48.71,4.81,91.36,14.3,126.78a264.59,264.59,0,0,0,17.62,47.85C275.06,623.51,257.76,689.9,186.81,702.08Z'/%3E%3Cpath class='cls-5' d='M573.54,620.85C553.51,546.69,512,491.91,512,491.91s-41.51,54.78-61.54,128.94c-41.75-5.81-86.95-23.72-116.89-78.56a556,556,0,0,1,34.09-61.65l.18-.27.17-.29c32.75-54.82,108.91-164.89,144-211.66,35.08,46.77,111.24,156.84,144,211.66l.17.29.18.27a556,556,0,0,1,34.09,61.65C660.49,597.13,615.29,615,573.54,620.85Z'/%3E%3Cpath class='cls-4' d='M837.48,702a.33.33,0,0,1-.23.09h-.06c-71-12.18-88.25-78.57-126.08-159.49a264.59,264.59,0,0,0,17.62-47.85C738.22,459.32,743,416.67,743,368c0-80.2-10.63-149-31.59-204.55-2.42-6.41-5-12.63-7.69-18.7C775.05,222.77,848.6,318,878.44,353.39,971.07,454.36,940.46,597.67,837.48,702Z'/%3E%3Cpath class='cls-1' d='M86.87,795.46a72.88,72.88,0,0,0-20.6-3.23q-14.64,0-23.2,6.58t-8.57,18Q34.5,828,44.56,835t28.66,14a128.07,128.07,0,0,1,23.45,10.8A47.92,47.92,0,0,1,112.56,876q6.33,10.31,6.33,26.18a48.6,48.6,0,0,1-7.2,26.06A49.76,49.76,0,0,1,91.21,946.6q-13.27,6.71-31.14,6.7a97,97,0,0,1-32-5.34A108.61,108.61,0,0,1,1,934.44l10.67-19.11a87.25,87.25,0,0,0,22.09,11.79A69,69,0,0,0,57.83,932q14.4,0,25.19-7.45t10.8-22.09q0-12.4-9.06-19.73T59.32,868.92a206.36,206.36,0,0,1-25.19-11.17,53.32,53.32,0,0,1-17.25-15q-7.2-9.56-7.19-24,0-21.1,14.76-34.13T62.8,770.89a105.51,105.51,0,0,1,53.85,14.39l-9.18,18.61A107.79,107.79,0,0,0,86.87,795.46Z'/%3E%3Cpath class='cls-1' d='M233.54,853.16q9.44,8.57,9.68,22.21v75.94H219.89v-68q-.49-8.68-5.21-13.65t-14.15-5.21q-13.65,0-22.58,10.92T169,903.17v48.14H145.93V848.57h20.85l1.49,19.85a40.26,40.26,0,0,1,16.38-17.49,49.08,49.08,0,0,1,25.07-6.33Q224.11,844.6,233.54,853.16Z'/%3E%3Cpath class='cls-1' d='M274.12,871.28a52.39,52.39,0,0,1,20.35-19.73,59.76,59.76,0,0,1,29.41-7.2q16.38,0,29.16,7.2a51.37,51.37,0,0,1,19.85,19.6A55.11,55.11,0,0,1,380,899a55.75,55.75,0,0,1-7.08,27.92,50.89,50.89,0,0,1-20,19.73q-12.9,7.2-29.53,7.2a61.16,61.16,0,0,1-29-6.83,50.34,50.34,0,0,1-20.22-19.23q-7.32-12.4-7.32-28.79A53.85,53.85,0,0,1,274.12,871.28Zm20.35,45.78A33.13,33.13,0,0,0,306.38,930a31,31,0,0,0,16.75,4.72q14.4,0,23.83-10.18t9.43-25.31q0-15.13-9.43-25.44a30.91,30.91,0,0,0-23.83-10.3,30.22,30.22,0,0,0-16.87,4.84,34.37,34.37,0,0,0-11.79,13,38.94,38.94,0,0,0,0,35.73Z'/%3E%3Cpath class='cls-1' d='M543,848.57l-47.4,108.95-33-70.48-30,70.48L384.93,848.57h22.84l27.54,62.29,19.11-44.67-8.19-17.62h20.11l27.79,63.78,26.06-63.78Z'/%3E%3Cpath class='cls-1' d='M665.13,759V951.31H641.8V935.18a52.58,52.58,0,0,1-18.24,13.65,56.06,56.06,0,0,1-23.7,5,50,50,0,0,1-26.06-6.95,48.15,48.15,0,0,1-18.24-19.49Q549,914.84,549,898.45q0-16.62,6.95-28.91A46.84,46.84,0,0,1,575,850.8a57.86,57.86,0,0,1,27.55-6.45,54.3,54.3,0,0,1,22.46,4.84,41.74,41.74,0,0,1,17,13.28V759ZM629.76,926.74a32.63,32.63,0,0,0,12-19.35V888a32.42,32.42,0,0,0-12.66-18.24,36.46,36.46,0,0,0-22.09-7.08A34.48,34.48,0,0,0,577,880a37.44,37.44,0,0,0,0,36.36,35.08,35.08,0,0,0,12.66,12.91,33.41,33.41,0,0,0,17.37,4.71Q620.46,933.94,629.76,926.74Z'/%3E%3Cpath class='cls-1' d='M731.26,858a57.48,57.48,0,0,1,15.52-9.93,42.26,42.26,0,0,1,14.39-3.72l-1,23.08A37.79,37.79,0,0,0,740,871.9a36,36,0,0,0-14.15,13.77,36.91,36.91,0,0,0-5.08,18.74v46.9H697.64V848.57h20.59L720,872.89A45.69,45.69,0,0,1,731.26,858Z'/%3E%3Cpath class='cls-1' d='M777.43,871.28a52.33,52.33,0,0,1,20.35-19.73,59.76,59.76,0,0,1,29.41-7.2q16.38,0,29.16,7.2a51.37,51.37,0,0,1,19.85,19.6,55.11,55.11,0,0,1,7.08,27.8,55.75,55.75,0,0,1-7.08,27.92,51,51,0,0,1-20,19.73q-12.9,7.2-29.53,7.2a61.13,61.13,0,0,1-29-6.83,50.27,50.27,0,0,1-20.22-19.23q-7.33-12.4-7.32-28.79A53.76,53.76,0,0,1,777.43,871.28Zm20.35,45.78A33.13,33.13,0,0,0,809.69,930a31,31,0,0,0,16.75,4.72q14.4,0,23.83-10.18t9.43-25.31q0-15.13-9.43-25.44a30.91,30.91,0,0,0-23.83-10.3,30.22,30.22,0,0,0-16.87,4.84,34.37,34.37,0,0,0-11.79,13,38.86,38.86,0,0,0,0,35.73Z'/%3E%3Cpath class='cls-1' d='M997.93,851.3a49.1,49.1,0,0,1,18.37,19.48q6.71,12.54,6.7,28.91,0,16.14-7.2,28.42a49.22,49.22,0,0,1-19.85,19,59.5,59.5,0,0,1-28.29,6.71A49.2,49.2,0,0,1,946.31,949a43.7,43.7,0,0,1-16.38-13v64.77H906.85V846.83H927l2,17.37a61.75,61.75,0,0,1,19-14.39,53.33,53.33,0,0,1,24-5.46A50,50,0,0,1,997.93,851.3Zm-16.75,79.29a35.47,35.47,0,0,0,13.28-12.66,33.6,33.6,0,0,0,5-18,36.9,36.9,0,0,0-4.59-18.36A34,34,0,0,0,964.68,864q-13.15,0-22.46,7.33A34.47,34.47,0,0,0,929.93,891v17.12a30.88,30.88,0,0,0,11.29,19.48,33.75,33.75,0,0,0,22,7.57A36.62,36.62,0,0,0,981.18,930.59Z'/%3E%3C/svg%3E",
          "metadata": {
            "pipelinePlatform": "maven"
          },
          "versions": [
            {
              "id": "current-community",
              "name": `${currentSpringBootVersion} (Community)`
            },
            {
              "id": "current-redhat",
              "name": `${currentSpringBootVersion} (RHOAR)`
            },
            {
              "id": "previous-community",
              "name": `${previousSpringBootVersion} (Community)`
            },
            {
              "id": "previous-redhat",
              "name": `${previousSpringBootVersion} (RHOAR)`
            }
          ]
        }
      ]
    }
  );
}

/* tslint:enable */

class DummyLatestTagRetriever implements LatestTagRetriever {
  public communityTag: string;
  public prodTag: string;

  constructor(communityTag: string, prodTag: string) {
    this.communityTag = communityTag;
    this.prodTag = prodTag;
  }

  public async getLatestTags(
    example: string, tagFilter?: (t: string) => boolean, token?: string): Promise<BoosterTagTuple> {

    return {
      community: this.valueOrUndefined(this.communityTag, tagFilter),
      prod: this.valueOrUndefined(this.prodTag, tagFilter),
    };
  }

  private valueOrUndefined(tag: string, tagFilter?: (t: string) => boolean) {
    if (!tagFilter) {
      return tag;
    }
    return tagFilter(tag) ? tag : undefined;
  }
}
