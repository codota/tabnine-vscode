import { extensions } from "vscode";

interface RequirementsData {
  tooling_jre: string;
  tooling_jre_version: number;
  java_home: string;
  java_version: number;
}
interface JavaExtensionAPI {
  readonly javaRequirement: RequirementsData;
}

export function getJavaHomePath(): string | undefined {
  const javaExension = extensions.getExtension<JavaExtensionAPI>("redhat.java");
  if (javaExension?.isActive) {
    return javaExension.exports.javaRequirement.java_home;
  }
  return undefined;
}
