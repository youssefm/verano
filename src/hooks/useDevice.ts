// hooks/useDevice.ts - Hook for managing Bluetooth device connection

import { useState, useCallback, useRef, useEffect } from "react";
import {
  VitruvianDevice,
  DeviceProgramParams,
  DeviceEchoParams,
} from "../lib/device";
import { MonitorSample } from "../lib/chart";

export interface UseDeviceReturn {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendStopCommand: () => Promise<void>;
  startProgram: (params: DeviceProgramParams) => Promise<void>;
  startEcho: (params: DeviceEchoParams) => Promise<void>;
  addMonitorListener: (listener: (sample: MonitorSample) => void) => void;
  addRepListener: (listener: (data: Uint8Array) => void) => void;
}

export function useDevice(): UseDeviceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const deviceRef = useRef<VitruvianDevice | null>(null);

  // Initialize device on mount
  useEffect(() => {
    deviceRef.current = new VitruvianDevice();
    return () => {
      deviceRef.current?.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      console.error(
        "[ERROR] Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.",
      );
      throw new Error("Web Bluetooth not supported");
    }

    try {
      await deviceRef.current?.connect();
      setIsConnected(true);
      await deviceRef.current?.sendInit();
    } catch (error) {
      console.error(`[ERROR] Connection failed: ${(error as Error).message}`);
      setIsConnected(false);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await deviceRef.current?.disconnect();
      setIsConnected(false);
    } catch (error) {
      console.error(`[ERROR] Disconnect failed: ${(error as Error).message}`);
      throw error;
    }
  }, []);

  const sendStopCommand = useCallback(async () => {
    try {
      await deviceRef.current?.sendStopCommand();
      console.log("[INFO] Workout stopped by user");
    } catch (error) {
      console.error(`[ERROR] Failed to stop workout: ${(error as Error).message}`);
      throw error;
    }
  }, []);

  const startProgram = useCallback(async (params: DeviceProgramParams) => {
    await deviceRef.current?.startProgram(params);
  }, []);

  const startEcho = useCallback(async (params: DeviceEchoParams) => {
    await deviceRef.current?.startEcho(params);
  }, []);

  const addMonitorListener = useCallback(
    (listener: (sample: MonitorSample) => void) => {
      deviceRef.current?.addMonitorListener(listener);
    },
    [],
  );

  const addRepListener = useCallback((listener: (data: Uint8Array) => void) => {
    deviceRef.current?.addRepListener(listener);
  }, []);

  // Handle device disconnection events
  useEffect(() => {
    const device = deviceRef.current;
    if (device) {
      const originalHandleDisconnect = device.handleDisconnect.bind(device);
      device.handleDisconnect = () => {
        originalHandleDisconnect();
        setIsConnected(false);
      };
    }
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    sendStopCommand,
    startProgram,
    startEcho,
    addMonitorListener,
    addRepListener,
  };
}
