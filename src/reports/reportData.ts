import * as systeminformation from "systeminformation";
import currentDateTime from "./utils";

const UNKNOWN_SPEED = -1;
const UNKNOWN_CORES_AMOUNT = -1;
const UNKNOWN_MEMORY_SIZE = -1;

const byteToGigabyte = (bytes: number): number => bytes / 1e9;

export type OsInfo = {
  platform: string;
  distro: string;
  arch: string;
  kernel: string;
};

export type CpuInfo = {
  manufacturer: string;
  brand: string;
  speedGHz: number;
  cores: number;
};

export type Specs = {
  os: OsInfo;
  cpu: CpuInfo;
  memoryGB: number;
};

export type ReportData = {
  timestamp: string;
  platform: string;
  distro: string;
  arch: string;
  kernel: string;
  cpu_manufacturer: string;
  cpu_brand: string;
  cores: string;
  speedGHz: string;
  memoryGB: string;
};

let specsCache: Promise<Specs> | undefined;

async function getSpecs(): Promise<Specs> {
  const [cpuData, osData, memoryData] = await Promise.all([
    systeminformation.cpu(),
    systeminformation.osInfo(),
    systeminformation.mem(),
  ]);

  return {
    os: {
      platform: osData?.platform ?? "unknown-platform",
      distro: osData?.distro ?? "unknown-distro",
      arch: osData?.arch ?? "unknown-arch",
      kernel: osData?.kernel ?? "unknown-kernel",
    },
    cpu: {
      manufacturer: cpuData?.manufacturer ?? "unknown-manufacturer",
      brand: cpuData?.brand ?? "unknown-brand",
      speedGHz: cpuData?.speed ?? UNKNOWN_SPEED,
      cores: cpuData?.cores ?? UNKNOWN_CORES_AMOUNT,
    },
    memoryGB: memoryData?.total
      ? Math.round(byteToGigabyte(memoryData.total))
      : UNKNOWN_MEMORY_SIZE,
  };
}

async function getSpecsCache(): Promise<Specs> {
  if (!specsCache) {
    specsCache = getSpecs();
  }

  return specsCache;
}

export default async function getReportData(): Promise<ReportData | undefined> {
  try {
    const specs = await getSpecsCache();

    return {
      timestamp: currentDateTime(),
      platform: `${specs.os.platform}`,
      distro: `${specs.os.distro}`,
      arch: `${specs.os.arch}`,
      kernel: `${specs.os.kernel}`,
      cpu_manufacturer: `${specs.cpu.manufacturer}`,
      cpu_brand: `${specs.cpu.brand}`,
      cores: `${specs.cpu.cores}`,
      speedGHz: `${specs.cpu.speedGHz}`,
      memoryGB: `${specs.memoryGB}`,
    };
  } catch (e) {
    console.log(`Could not fetch specs data, skipping: ${e}`);
    return undefined;
  }
}
