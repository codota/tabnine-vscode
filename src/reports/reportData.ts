import { cpu, osInfo, mem } from "systeminformation";
import { Logger } from "../utils/logger";

const UNKNOWN_SPEED = -1;
const UNKNOWN_CORES_AMOUNT = -1;
const UNKNOWN_MEMORY_SIZE = -1;

const byteToGigabyte = (bytes: number): number => bytes / 1e9;

function currentDateTimeUTC(): string {
  const date = new Date();
  return date.toISOString();
}

export type OsInfo = {
  platform: string;
  distro: string;
  arch: string;
  kernel: string;
};

export type CpuInfo = {
  manufacturer: string;
  brand: string;
  speed_ghz: number;
  cores: number;
};

export type Specs = {
  os: OsInfo;
  cpu: CpuInfo;
  memory_gb: number;
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
  speed_ghz: string;
  memory_gb: string;
};

let specsCache: Promise<Specs> | undefined;

async function getSpecs(): Promise<Specs> {
  const [cpuData, osData, memoryData] = await Promise.all([
    cpu(),
    osInfo(),
    mem(),
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
      speed_ghz: cpuData?.speed ?? UNKNOWN_SPEED,
      cores: cpuData?.cores ?? UNKNOWN_CORES_AMOUNT,
    },
    memory_gb: memoryData?.total
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
      timestamp: currentDateTimeUTC(),
      platform: `${specs.os.platform}`,
      distro: `${specs.os.distro}`,
      arch: `${specs.os.arch}`,
      kernel: `${specs.os.kernel}`,
      cpu_manufacturer: `${specs.cpu.manufacturer}`,
      cpu_brand: `${specs.cpu.brand}`,
      cores: `${specs.cpu.cores}`,
      speed_ghz: `${specs.cpu.speed_ghz}`,
      memory_gb: `${specs.memory_gb}`,
    };
  } catch (e) {
    Logger.warn(`Could not fetch specs data, skipping: ${e}`);
    return undefined;
  }
}
