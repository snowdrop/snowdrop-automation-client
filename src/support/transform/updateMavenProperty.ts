import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";

/**
 * Update a Maven property name
 *
 * The property needs to exist in order for this to work
 * This is a hack since there is no strong guarantee that
 * the property exists in the root properties section
 * Hopefully we will be able to fix this in the future. See https://github.com/atomist/sdm-pack-spring/issues/15
 */
export function updateMavenPropertyEditor(...nameValuePairs: NameValuePair[]): SimpleProjectEditor {
  return async project => {
    const pom = await project.getFile("pom.xml");
    if (pom) {
      const initialContent = await pom.getContent();
      const reducer = (previousContent: string, pair: NameValuePair) => {
        const name = pair.name;
        const value = pair.value;
        return previousContent.replace(
            new RegExp(`<${name}>[\\s\\S]*?<\/${name}>`),
            `<${name}>${value}</${name}>`,
        );
      };
      const finalContent = nameValuePairs.reduce(reducer, initialContent);
      await pom.setContent(finalContent);
    }
    return project;
  };
}

export class NameValuePair {
  public name: string;
  public value: string;
}
