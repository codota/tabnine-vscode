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

let specs: Promise<Specs> | undefined;

async function getSpecs(): Promise<Specs> {
  if (!specs) {
    specs = new Promise<Specs>((resolve) => {
      void systeminformation.cpu().then((cpuData) => {
        void systeminformation.osInfo().then((osData) => {
          void systeminformation.mem().then((memoryData) => {
            resolve({
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
            });
          });
        });
      });
    });
  }

  return specs;
}

export default async function getReportData(): Promise<ReportData> {
  const machineSpecs = await getSpecs();

  return {
    timestamp: `${new Date().getTime()}`,
    os: `${machineSpecs.os.platform}-${machineSpecs.os.distro}-${machineSpecs.os.arch}`,
    kernel: `${machineSpecs.os.kernel}`,
    cpu: `${machineSpecs.cpu.manufacturer}-${machineSpecs.cpu.brand}`,
    cores: `${machineSpecs.cpu.cores}`,
    speedGHz: `${machineSpecs.cpu.speedGHz}`,
    memoryBytes: `${machineSpecs.memoryBytes}`,
  };
}
