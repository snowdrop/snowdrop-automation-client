import * as parser from "xml2json";

import axios from "axios";

import {logger, Project, SimpleProjectEditor} from "@atomist/automation-client";

import {config} from "@atomist/automation-client/lib/internal/util/config";
import {SPRING_BOOT_VERSION_PROPERTY_NAME, SPRING_BOOT_VERSION_REGEX} from "../../../constants";
import {setParentVersion, setProperty, setVersion} from "../../utils/pomUtils";

const IGNORED_PROPERTIES = config("bom.alignment.ignoredProperties") as string[];

export function alignBomWithUpstream(springBootVersion: string): SimpleProjectEditor {
  validateSpringBootVersion(springBootVersion);
  return async project => {
    const upstreamProperties: Map<string, string> = await getUpstreamProperties(springBootVersion);
    const updatedProperties = new Map<string, string>();
    const pom: any = await getProjectPom(project);

    await setVersion(project, springBootVersionToBomVersion(springBootVersion));
    await setParentVersion(project, springBootVersion);
    await setProperty(project, SPRING_BOOT_VERSION_PROPERTY_NAME, springBootVersion);
    updatedProperties.set(SPRING_BOOT_VERSION_PROPERTY_NAME, springBootVersion);

    for (const key of Object.keys(pom.project.properties)) {
      if (!IGNORED_PROPERTIES.includes(key) && upstreamProperties.has(key)
          && upstreamProperties.get(key) !== pom.project.properties[key]) {
        await setProperty(project, key, upstreamProperties.get(key));
        updatedProperties.set(key, upstreamProperties.get(key));
      }
    }

    await updateReadme(project, updatedProperties);

    return project;
  };
}

function validateSpringBootVersion(springBootVersion: string): void {
  if (!springBootVersion.match(SPRING_BOOT_VERSION_REGEX)) {
    logger.warn(`Invalid Spring Boot version '${springBootVersion}'`);
    throw new Error(`Invalid Spring Boot version: '${springBootVersion}'`);
  }
}

async function getProjectPom(project: Project): Promise<any> {
  const file = await project.getFile("pom.xml");
  const content = await file.getContent();
  return parser.toJson(content, {object: true});
}

async function getUpstreamProperties(springBootVersion: string): Promise<Map<string, string>> {
  return axios.get(getUpstreamBomUrl(springBootVersion))
      .then(response => {
        if (response.status === 200) {
          return parser.toJson(response.data, {object: true}) as any;
        }
        throw new Error("Failed to get upstream BOM: " + response.statusText);
      })
      .then(pom => {
        const properties = new Map<string, string>();
        for (const key of Object.keys(pom.project.properties)) {
          properties.set(key, pom.project.properties[key]);
        }
        return properties;
      });
}

async function updateReadme(project: Project, properties: Map<string, string>): Promise<void> {
  const file = await project.getFile("README.adoc");
  const content = await file.getContent();

  const lines = content.split("\n");
  const result = lines;
  let propertyKey: string;
  lines.forEach((line, index) => {
    let toAppend = line;
    if (line.startsWith("//")) {
      // if line is a comment, record the name of the property to use
      propertyKey = line.slice(2).trim() + ".version";
    } else if (propertyKey) {
      // if we have previously set property (i.e. the previous line was a comment)
      // check if it matches a property that was updated in the BOM
      if (properties.has(propertyKey)) {
        // if it is an updated property, replace the end of the line after the last ':' with the new version
        const lastColumn = line.lastIndexOf(":");
        toAppend = line.slice(0, lastColumn) + `: ${properties.get(propertyKey)}`;
      }
      // reset the property state
      propertyKey = undefined;
    }
    result[index] = toAppend;
  });

  await file.setContent(result.join("\n"));
}

function springBootVersionToBomVersion(springBootVersion: string): string {
  return springBootVersion.match(SPRING_BOOT_VERSION_REGEX)[1] + "-SNAPSHOT";
}

function getUpstreamBomUrl(springBootVersion: string): string {
  if (springBootVersion.startsWith("1.5")) {
    // tslint:disable-next-line: max-line-length
    return `https://raw.githubusercontent.com/spring-projects/spring-boot/v${springBootVersion}/spring-boot-dependencies/pom.xml`;
  }
  // tslint:disable-next-line: max-line-length
  return `https://raw.githubusercontent.com/spring-projects/spring-boot/v${springBootVersion}/spring-boot-project/spring-boot-dependencies/pom.xml`;
}
