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

export function getJavaRuntime(): string | undefined {
  const redhatExension = extensions.getExtension<JavaExtensionAPI>(
    "redhat.java"
  );
  if (redhatExension?.isActive) {
    return redhatExension.exports.javaRequirement.java_home;
  }
  return undefined;
}
