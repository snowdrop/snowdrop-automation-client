import {logger, Project} from "@atomist/automation-client";
import {doWithAllMatches} from "@atomist/automation-client/lib/tree/ast/astUtils";
import {XmldocFileParser} from "@atomist/sdm-pack-spring/lib/xml/XmldocFileParser";
import * as parser from "xml2json";

export function getPomAsJson(p: Project): Promise<any> {
  return p.getFile("pom.xml")
      .then(pomFile => pomFile.getContent())
      .then(pomContent => {
        return parser.toJson(pomContent, {object: true}) as any;
      });
}

export function getCurrentVersion(p: Project): Promise<string> {
  return getPomAsJson(p).then(pomAJsonObj => pomAJsonObj.project.version as string);
}

export function getCurrentVersionWithoutSnapshot(p: Project): Promise<string> {
  return getCurrentVersion(p).then(v => v.replace("-SNAPSHOT", ""));
}

export function setParentVersion(project: Project, version: string): Promise<Project> {
  logger.info(`Setting pom parent version to ${version}`);
  return setVersion(project, "pom.xml", "/project/parent/version", version);
}

export function setProjectVersion(project: Project, version: string): Promise<Project> {
  logger.info(`Setting pom version to ${version}`);
  return setVersion(project, "pom.xml", "/project/version", version)
      .then(p => setVersion(p, "*/pom.xml", "/project/parent/version", version));
}

function setVersion(project: Project, filePattern: string, attributePath: string, version: string): Promise<Project> {
  return doWithAllMatches(project, new XmldocFileParser(), filePattern, attributePath,
      match => match.$value = `<version>${version}</version>`);
}

export function setProperty(project: Project, key: string, value: string): Promise<Project> {
  logger.info(`Setting pom property ${key}=${value}`);
  return doWithAllMatches(project, new XmldocFileParser(), "pom.xml", `/project/properties/${key}`, match => {
    match.$value = match.$value.replace(new RegExp(`<${key}>[\\s\\S]*?<\/${key}>`), `<${key}>${value}</${key}>`);
  });
}
