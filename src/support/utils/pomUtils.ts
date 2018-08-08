import {Project} from "@atomist/automation-client/project/Project";
import * as parser from "xml2json";

export function getPomAsJson(p: Project): Promise<any> {
  return p.getFile("pom.xml")
  .then(pomFile => pomFile.getContent())
  .then(pomContent => {
    return parser.toJson(pomContent, {object: true}) as any;
  });
}

export function getCurrentVersion(p: Project): Promise<String> {
  return getPomAsJson(p).then(pomAJsonObj =>  pomAJsonObj.project.version as string);
}