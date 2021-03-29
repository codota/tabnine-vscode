import * as systeminformation from "systeminformation";

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
  os: string;
  kernel: string;
  cpu: string;
  cores: string;
  speedGHz: string;
  memoryGB: string;
};

let specsCache: Promise<Specs> | undefined;

async function getSpecs(): Promise<Specs> {
  const cpuData = await systeminformation.cpu();
  const osData = await systeminformation.osInfo();
  const memoryData = await systeminformation.mem();

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

export default async function getReportData(): Promise<ReportData> {
  const specs = await getSpecsCache();

  return {
    timestamp: `${new Date().getTime()}`,
    os: `${specs.os.platform}-${specs.os.distro}-${specs.os.arch}`,
    kernel: `${specs.os.kernel}`,
    cpu: `${specs.cpu.manufacturer}-${specs.cpu.brand}`,
    cores: `${specs.cpu.cores}`,
    speedGHz: `${specs.cpu.speedGHz}`,
    memoryGB: `${specs.memoryGB}`,
  };
}
