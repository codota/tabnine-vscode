import * as systeminformation from "systeminformation";

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
  memoryBytes: number;
};

export type ReportData = {
  timestamp: string;
  os: string;
  kernel: string;
  cpu: string;
  cores: string;
  speedGHz: string;
  memoryBytes: string;
};

let specs: Specs;

export async function initReporterData(): Promise<void> {
  if (!specs) {
    console.log("kaki");

    const [cpuData, osData, memoryData] = await Promise.all([
      systeminformation.cpu(),
      systeminformation.osInfo(),
      systeminformation.mem(),
    ]);

    specs = {
      os: {
        platform: osData.platform,
        distro: osData.distro,
        arch: osData.arch,
        kernel: osData.kernel,
      },
      cpu: {
        manufacturer: cpuData.manufacturer,
        brand: cpuData.brand,
        speedGHz: cpuData.speed,
        cores: cpuData.cores,
      },
      memoryBytes: memoryData.total,
    };
  }
}

export default function getReportData(): ReportData {
  return {
    timestamp: `${new Date().getTime()}`,
    os: `${specs.os.platform}-${specs.os.distro}-${specs.os.arch}`,
    kernel: `${specs.os.kernel}`,
    cpu: `${specs.cpu.manufacturer}-${specs.cpu.brand}`,
    cores: `${specs.cpu.cores}`,
    speedGHz: `${specs.cpu.speedGHz}`,
    memoryBytes: `${specs.memoryBytes}`,
  };
}
