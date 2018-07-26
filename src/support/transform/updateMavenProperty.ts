import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";

/**
 * Update a Maven property name
 *
 * The property needs to exist in order for this to work
 * This is a hack since there is no strong guarantee that
 * the property exists in the root properties section
 * Hopefully we will be able to fix this in the future. See https://github.com/atomist/sdm-pack-spring/issues/15
 */
export function updateMavenPropertyEditor(name: string, value: string): SimpleProjectEditor {
  return async project => {
    const pom = await project.getFile("pom.xml");
    if (pom) {
      const content = await pom.getContent();
      await pom.setContent(
          content.replace(
              new RegExp(`<${name}>[\\s\\S]*?<\/${name}>`),
              `<${name}>${value}</${name}>`,
          ),
      );
    }
    return project;
  };
}
