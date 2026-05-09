import {
  VitruvianDevice,
  type DeviceEchoParams,
  type DeviceProgramParams,
  type MonitorListener,
  type RepListener,
} from "./device.js";
import { createDevDeviceClient } from "./deviceSimulator.js";

export interface DeviceClient {
  onConnect: (() => void) | null;
  onDisconnect: (() => void) | null;
  reconnect: (timeoutMs: number) => Promise<boolean>;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  sendInit: () => Promise<void>;
  sendStopCommand: () => Promise<void>;
  startProgram: (params: DeviceProgramParams) => Promise<void>;
  startEcho: (params: DeviceEchoParams) => Promise<void>;
  setMonitorListener: (listener: MonitorListener) => void;
  setRepListener: (listener: RepListener) => void;
}

export function createDeviceClient(): DeviceClient {
  if (import.meta.env.DEV) {
    return createDevDeviceClient();
  }

  return new VitruvianDevice();
}
