/**
 * Update a Maven property name
 *
 * The property needs to exist in order for this to work
 * This is a hack since there is no strong guarantee that
 * the property exists in the root properties section
 * Hopefully we will be able to fix this in the future. See https://github.com/atomist/sdm-pack-spring/issues/15
 */
import {SimpleProjectEditor} from "@atomist/automation-client/lib/operations/edit/projectEditor";
import {Project} from "@atomist/automation-client/lib/project/Project";
import {doWithAllMatches} from "@atomist/automation-client/lib/tree/ast/astUtils";
import {XmldocFileParser} from "@atomist/sdm-pack-spring/lib/xml/XmldocFileParser";

export function updateMavenProperty(...nameValuePairs: NameValuePair[]): SimpleProjectEditor {

  return async (p: Project) => {
    for(const pair of nameValuePairs) {
      await doWithAllMatches(p, new XmldocFileParser(),
          "pom.xml",
          `/project/properties/${pair.name}`,
          n => {
            const name = pair.name;
            const value = pair.value;
            n.$value = n.$value.replace(
                new RegExp(`<${name}>[\\s\\S]*?<\/${name}>`),
                `<${name}>${value}</${name}>`,
            );
          });
    }

    return p;
  };
}

export class NameValuePair {
  public name: string;
  public value: string;
}
