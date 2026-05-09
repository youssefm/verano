import {
  VitruvianDevice,
  type DeviceEchoParams,
  type DeviceProgramParams,
  type MonitorListener,
  type RepListener,
} from "./device.js";
import type { DeviceClient } from "./deviceClient.js";
import type { MonitorSample } from "./types.js";

interface DeviceSimulatorState {
  isConnected: boolean;
  isSimulated: boolean;
  topCounter: number;
  completeCounter: number;
  ticks: number;
}

interface VeranoDeviceSimulatorApi {
  connect: () => void;
  disconnect: () => void;
  sample: (sample?: Partial<MonitorSample>) => MonitorSample;
  rep: () => void;
  reps: (count: number) => void;
  completeWarmup: () => void;
  completeWorking: (reps?: number) => void;
  state: () => DeviceSimulatorState;
}

declare global {
  interface Window {
    __veranoDevice?: VeranoDeviceSimulatorApi;
  }
}

interface DeviceSimulatorCallbacks {
  log: (message: string, type?: string) => void;
  setConnected: (connected: boolean) => void;
  disconnect: () => void;
  dispatchMonitor: (sample: MonitorSample) => void;
  dispatchRepNotification: (data: Uint8Array) => void;
}

export class VitruvianDeviceSimulator {
  private callbacks: DeviceSimulatorCallbacks;
  isActive: boolean;
  topCounter: number;
  completeCounter: number;
  ticks: number;
  repIndex: number;
  baselineSeeded: boolean;

  constructor(callbacks: DeviceSimulatorCallbacks) {
    this.callbacks = callbacks;
    this.isActive = false;
    this.topCounter = 0;
    this.completeCounter = 0;
    this.ticks = 0;
    this.repIndex = 0;
    this.baselineSeeded = false;
  }

  installWindowApi(): void {
    if (!import.meta.env.DEV || typeof window === "undefined") return;

    window.__veranoDevice = {
      connect: () => this.connect(),
      disconnect: () => this.disconnect(),
      sample: (sample) => this.emitSample("custom", sample),
      rep: () => this.emitRep(),
      reps: (count) => this.emitReps(count),
      completeWarmup: () => this.emitReps(3),
      completeWorking: (reps = 8) => {
        const targetTotalReps = 3 + reps;
        this.emitReps(Math.max(0, targetTotalReps - this.completeCounter));
      },
      state: () => this.state(),
    };
  }

  connect(): void {
    this.isActive = true;
    this.resetCounters();
    this.callbacks.log("Simulated Vitruvian device connected", "success");
    this.callbacks.setConnected(true);
  }

  disconnect(): void {
    this.callbacks.log("Simulated Vitruvian device disconnected", "info");
    this.isActive = false;
    this.callbacks.disconnect();
  }

  sendInit(): void {
    this.callbacks.log("Simulated device initialized and ready!", "success");
  }

  sendStopCommand(): void {
    this.callbacks.log("Simulated workout stopped!", "success");
  }

  startProgram(): void {
    this.resetCounters();
    this.emitSample("bottom");
    this.callbacks.log("Simulated program started successfully!", "success");
  }

  startEcho(): void {
    this.resetCounters();
    this.emitSample("bottom");
    this.callbacks.log("Simulated Echo mode started successfully!", "success");
  }

  startMonitorPolling(): void {
    this.callbacks.log(
      "Monitor polling is driven by the device simulator",
      "info"
    );
  }

  state(): DeviceSimulatorState {
    return {
      isConnected: this.isActive,
      isSimulated: this.isActive,
      topCounter: this.topCounter,
      completeCounter: this.completeCounter,
      ticks: this.ticks,
    };
  }

  private resetCounters(): void {
    this.topCounter = 0;
    this.completeCounter = 0;
    this.ticks = 0;
    this.repIndex = 0;
    this.baselineSeeded = false;
  }

  private emitSample(
    phase: "top" | "bottom" | "custom",
    overrides: Partial<MonitorSample> = {}
  ): MonitorSample {
    this.ticks += 100;

    const variance = this.repIndex % 3;
    const posA = phase === "top" ? 840 + variance * 8 : 120 + variance * 4;
    const posB = phase === "top" ? 820 + variance * 7 : 110 + variance * 5;
    const loadA = phase === "top" ? 13.7 : 12.5;
    const loadB = phase === "top" ? 13.3 : 12.5;

    const sample: MonitorSample = {
      timestamp: new Date(),
      ticks: this.ticks,
      posA,
      posB,
      loadA,
      loadB,
      ...overrides,
    };

    this.callbacks.dispatchMonitor(sample);
    return sample;
  }

  private emitRepNotification(): void {
    const data = new Uint8Array(6);
    const view = new DataView(data.buffer);
    view.setUint16(0, this.topCounter, true);
    view.setUint16(2, 0, true);
    view.setUint16(4, this.completeCounter, true);
    this.callbacks.dispatchRepNotification(data);
  }

  private seedRepBaseline(): void {
    if (this.baselineSeeded) return;

    this.emitSample("bottom");
    this.emitRepNotification();
    this.baselineSeeded = true;
  }

  private emitRep(): void {
    this.seedRepBaseline();

    this.topCounter += 1;
    this.emitSample("top");
    this.emitRepNotification();

    this.completeCounter += 1;
    this.repIndex += 1;
    this.emitSample("bottom");
    this.emitRepNotification();
  }

  private emitReps(count: number): void {
    const safeCount = Math.max(0, Math.floor(count));
    for (let i = 0; i < safeCount; i += 1) {
      this.emitRep();
    }
  }
}

class DevDeviceClient implements DeviceClient {
  private realDevice: VitruvianDevice;
  private simulator: VitruvianDeviceSimulator;
  private monitorListener: MonitorListener | null;
  private repListener: RepListener | null;
  onConnect: (() => void) | null;
  onDisconnect: (() => void) | null;

  constructor() {
    this.realDevice = new VitruvianDevice();
    this.monitorListener = null;
    this.repListener = null;
    this.onConnect = null;
    this.onDisconnect = null;

    this.realDevice.setMonitorListener((sample) =>
      this.monitorListener?.(sample)
    );
    this.realDevice.setRepListener((data) => this.repListener?.(data));
    this.realDevice.onConnect = () => this.onConnect?.();
    this.realDevice.onDisconnect = () => this.onDisconnect?.();

    this.simulator = new VitruvianDeviceSimulator({
      log: (message, type) => this.realDevice.log(message, type),
      setConnected: (connected) => {
        if (connected) {
          this.onConnect?.();
        } else {
          this.onDisconnect?.();
        }
      },
      disconnect: () => this.onDisconnect?.(),
      dispatchMonitor: (sample) => this.monitorListener?.(sample),
      dispatchRepNotification: (data) => this.repListener?.(data),
    });
    this.simulator.installWindowApi();
  }

  reconnect(timeoutMs: number): Promise<boolean> {
    return this.realDevice.reconnect(timeoutMs);
  }

  async connect(): Promise<boolean> {
    if (!navigator.bluetooth) {
      this.simulator.connect();
      return true;
    }

    return await this.realDevice.connect();
  }

  disconnect(): void {
    if (this.simulator.isActive) {
      this.simulator.disconnect();
      return;
    }

    this.realDevice.disconnect();
  }

  async sendInit(): Promise<void> {
    if (this.simulator.isActive) {
      this.simulator.sendInit();
      return;
    }

    await this.realDevice.sendInit();
  }

  async sendStopCommand(): Promise<void> {
    if (this.simulator.isActive) {
      this.simulator.sendStopCommand();
      return;
    }

    await this.realDevice.sendStopCommand();
  }

  async startProgram(params: DeviceProgramParams): Promise<void> {
    if (this.simulator.isActive) {
      this.simulator.startProgram();
      return;
    }

    await this.realDevice.startProgram(params);
  }

  async startEcho(params: DeviceEchoParams): Promise<void> {
    if (this.simulator.isActive) {
      this.simulator.startEcho();
      return;
    }

    await this.realDevice.startEcho(params);
  }

  setMonitorListener(listener: MonitorListener): void {
    this.monitorListener = listener;
  }

  setRepListener(listener: RepListener): void {
    this.repListener = listener;
  }
}

export function createDevDeviceClient(): DeviceClient {
  return new DevDeviceClient();
}
