import { extensions } from "vscode";
import { Logger } from "../../utils/logger";

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
  try {
    const javaExension = extensions.getExtension<JavaExtensionAPI>(
      "redhat.java"
    );
    if (javaExension?.isActive) {
      return javaExension.exports.javaRequirement.java_home;
    }
    return undefined;
  } catch (e) {
    Logger.error(`Failde to get java sdk information: ${e}`);
    return undefined;
  }
}
