import {Project} from "@atomist/automation-client";
import * as parser from "xml2json";

export function getPomAsJson(p: Project): Promise<any> {
  return p.getFile("pom.xml")
  .then(pomFile => pomFile.getContent())
  .then(pomContent => {
    return parser.toJson(pomContent, {object: true}) as any;
  });
}

export function getCurrentVersion(p: Project): Promise<string> {
  return getPomAsJson(p).then(pomAJsonObj =>  pomAJsonObj.project.version as string);
}

export function getCurrentVersionWithoutSnapshot(p: Project): Promise<string> {
  return getCurrentVersion(p).then(v => v.replace("-SNAPSHOT", ""));
}
