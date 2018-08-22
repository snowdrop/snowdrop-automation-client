import * as _ from "lodash";
import * as parser from "xml2json";

export function calculateNewPropertyVersions(
    referenceBomContent: string, existingBomContent: string): ReadonlyMap<string, string> {

  const referenceBomDependencies = bomArtifacts(referenceBomContent);
  const referenceBomGaToDependencyMap = gaToDependencyWithPropertyNameMap(referenceBomDependencies);
  const existingBomArtifacts = bomArtifacts(existingBomContent);

  return existingBomArtifacts
          // keep artifacts that match in the boms and have different versions
          .filter(existingDependency => {
            const gaOfDependency = ga(existingDependency);
            if (referenceBomGaToDependencyMap.has(gaOfDependency)) {
              const versionInReferenceBom = referenceBomGaToDependencyMap.get(gaOfDependency).version;
              // we only want to keep dependencies that have changed
              return versionInReferenceBom !== existingDependency.version;
            }
            // the reference BOM did not have the dependency
            return false;
          })
          // create tuple of existing and matching dependencies
          .map(existingDependency => {
            const matchingReferenceDependency = referenceBomGaToDependencyMap.get(ga(existingDependency));
            return [existingDependency, matchingReferenceDependency];
          })
          .reduce(
              (map, dependencyTuple) => {
                const existingDependency = dependencyTuple[0];
                const matchingReferenceDependency = dependencyTuple[1];
                map.set(existingDependency.propertyName, matchingReferenceDependency.version);
                return map;
              },
              new Map<string, string>(),
          );
}

interface VersionedArtifactWithPropertyName {
  group: string;
  artifact: string;
  version: string;
  propertyName?: string;
}

function bomArtifacts(bomContent: string): VersionedArtifactWithPropertyName[] {
  const bom = bomJson(bomContent);
  const dependencies = dependenciesArray(bom);

  return dependencies.map(d => {
    const originalVersion = d.version as string;

    if (originalVersion.startsWith("$")) {
      const propertyName = originalVersion.replace("${", "").replace("}", "");
      return {group: d.groupId, artifact: d.artifactId, version: propertiesMap(bom).get(propertyName), propertyName};
    } else {
      return {group: d.groupId, artifact: d.artifactId, version: originalVersion};
    }
  });
}

function bomJson(bomContent: string): any {
  return parser.toJson(bomContent, {object: true}) as any;
}

function propertiesMap(json: any): Map<string, string> {
  return new Map<string, string>(Object.entries(_.get(json, "project.properties")));
}

function dependenciesArray(json: any): any[] {
  return _.get(json, "project.dependencyManagement.dependencies.dependency", []) as any[];
}

function gaToDependencyWithPropertyNameMap(dependencies: VersionedArtifactWithPropertyName[]):
    ReadonlyMap<string, VersionedArtifactWithPropertyName> {

  return dependencies
          .filter(d => !_.isEmpty(d.propertyName))
          .reduce(
              (map, dependency) => {
                map.set(ga(dependency), dependency);
                return map;
              },
              new Map<string, VersionedArtifactWithPropertyName>(),
          );
}

function ga(dependency: VersionedArtifactWithPropertyName): string {
  return `${dependency.group}:${dependency.artifact}`;
}
