import * as Device from 'expo-device';
import { Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import type { HardwareProfile } from '../types/hardware';
import type { ModelListing } from '../types/models';

function mapDeviceType(
  value: Device.DeviceType | null,
): HardwareProfile['deviceType'] {
  switch (value) {
    case Device.DeviceType.PHONE:
      return 'phone';
    case Device.DeviceType.TABLET:
      return 'tablet';
    case Device.DeviceType.DESKTOP:
      return 'desktop';
    case Device.DeviceType.TV:
      return 'tv';
    default:
      return 'unknown';
  }
}

export async function detectHardware(): Promise<HardwareProfile> {
  const platform =
    Platform.OS === 'ios'
      ? 'ios'
      : Platform.OS === 'android'
        ? 'android'
        : Platform.OS === 'web'
          ? 'web'
          : 'unknown';

  let freeStorageBytes: number | null = null;
  let totalStorageBytes: number | null = null;
  try {
    freeStorageBytes = Paths.availableDiskSpace;
  } catch {
    freeStorageBytes = null;
  }
  try {
    totalStorageBytes = Paths.totalDiskSpace;
  } catch {
    totalStorageBytes = null;
  }

  const totalRamBytes = Device.totalMemory;
  const recommendedMaxModelRamBytes = totalRamBytes
    ? Math.floor(totalRamBytes * 0.5)
    : 1_500_000_000;

  return {
    platform,
    modelName: Device.modelName,
    manufacturer: Device.manufacturer,
    osVersion: Device.osVersion,
    androidApiLevel: Device.platformApiLevel,
    totalRamBytes,
    freeStorageBytes,
    totalStorageBytes,
    cpuArchitectures: Device.supportedCpuArchitectures,
    isDevice: Device.isDevice,
    deviceType: mapDeviceType(Device.deviceType),
    estimatedGpuAvailable: platform === 'ios' || platform === 'android',
    recommendedMaxModelRamBytes,
  };
}

export function canInstallModel(
  model: ModelListing,
  hardware: HardwareProfile,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (
    hardware.platform !== 'unknown' &&
    hardware.platform !== 'web' &&
    !model.supportedPlatforms.includes(hardware.platform)
  ) {
    reasons.push(`Not supported on ${hardware.platform}`);
  }

  // RAM over budget is advisory only — users may still download larger models.
  // Storage shortfall remains a hard blocker.

  if (
    hardware.freeStorageBytes != null &&
    model.requiredStorageBytes > hardware.freeStorageBytes
  ) {
    reasons.push('Insufficient free storage for this download');
  }

  return { ok: reasons.length === 0, reasons };
}
