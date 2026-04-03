// hooks/useDevice.ts - Hook for managing Bluetooth device connection

import { useState, useCallback, useRef, useEffect } from "react";
import {
  VitruvianDevice,
  DeviceProgramParams,
  DeviceEchoParams,
} from "../lib/device";
import { MonitorSample } from "../lib/types";

export interface UseDeviceReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendStopCommand: () => Promise<void>;
  startProgram: (params: DeviceProgramParams) => Promise<void>;
  startEcho: (params: DeviceEchoParams) => Promise<void>;
  setMonitorListener: (listener: (sample: MonitorSample) => void) => void;
  setRepListener: (listener: (data: Uint8Array) => void) => void;
}

export function useDevice(): UseDeviceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const deviceRef = useRef<VitruvianDevice | null>(null);

  // Listener refs — the device dispatches through these so we never
  // need to re-register on the device when the consumer's callback changes.
  const monitorListenerRef = useRef<((sample: MonitorSample) => void) | null>(
    null
  );
  const repListenerRef = useRef<((data: Uint8Array) => void) | null>(null);

  // Initialize device on mount and register stable delegates once
  useEffect(() => {
    const device = new VitruvianDevice();
    deviceRef.current = device;

    device.setMonitorListener((sample) => monitorListenerRef.current?.(sample));
    device.setRepListener((data) => repListenerRef.current?.(data));

    // Handle device disconnection events
    device.onDisconnect = () => setIsConnected(false);

    // Auto-reconnect to previously paired device
    const autoConnect = async () => {
      setIsConnecting(true);
      try {
        const ok = await device.reconnect(10_000);
        if (ok) {
          setIsConnected(true);
          await device.sendInit();
        }
      } catch {
        // Silent failure — user can connect manually
      } finally {
        setIsConnecting(false);
      }
    };
    autoConnect();

    return () => {
      device.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      console.error(
        "[ERROR] Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera."
      );
      throw new Error("Web Bluetooth not supported");
    }

    const device = deviceRef.current;
    if (!device) return;

    setIsConnecting(true);
    try {
      // If we have a previously paired device, reconnect without the picker
      const ok = await device.reconnect(10_000);
      if (!ok) {
        // No paired device or not in range — fall back to browser picker
        await device.connect();
      }
      setIsConnected(true);
      await device.sendInit();
    } catch (error) {
      console.error(`[ERROR] Connection failed: ${(error as Error).message}`);
      setIsConnected(false);
      throw error;
    } finally {
      setIsConnecting(false);
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
      console.error(
        `[ERROR] Failed to stop workout: ${(error as Error).message}`
      );
      throw error;
    }
  }, []);

  const startProgram = useCallback(async (params: DeviceProgramParams) => {
    await deviceRef.current?.startProgram(params);
  }, []);

  const startEcho = useCallback(async (params: DeviceEchoParams) => {
    await deviceRef.current?.startEcho(params);
  }, []);

  // These just update refs — no device interaction, stable identity, safe to call any time
  const setMonitorListener = useCallback(
    (listener: (sample: MonitorSample) => void) => {
      monitorListenerRef.current = listener;
    },
    []
  );

  const setRepListener = useCallback((listener: (data: Uint8Array) => void) => {
    repListenerRef.current = listener;
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendStopCommand,
    startProgram,
    startEcho,
    setMonitorListener,
    setRepListener,
  };
}
