// hooks/useDevice.ts - Hook for managing Bluetooth device connection

import { useState, useCallback, useRef, useEffect } from "react";
import {
  VitruvianDevice,
  DeviceProgramParams,
  DeviceEchoParams,
} from "../device";
import { MonitorSample } from "../chart";
import { LogEntry } from "../types";

export interface UseDeviceReturn {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendStopCommand: () => Promise<void>;
  startProgram: (params: DeviceProgramParams) => Promise<void>;
  startEcho: (params: DeviceEchoParams) => Promise<void>;
  addMonitorListener: (listener: (sample: MonitorSample) => void) => void;
  addRepListener: (listener: (data: Uint8Array) => void) => void;
  logs: LogEntry[];
  addLog: (message: string, type: "info" | "success" | "error") => void;
  clearLogs: () => void;
}

export function useDevice(): UseDeviceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const deviceRef = useRef<VitruvianDevice | null>(null);

  // Initialize device on mount
  useEffect(() => {
    deviceRef.current = new VitruvianDevice();
    return () => {
      deviceRef.current?.disconnect();
    };
  }, []);

  const addLog = useCallback(
    (message: string, type: "info" | "success" | "error" = "info") => {
      setLogs((prev) => {
        const newLogs = [
          ...prev,
          {
            id: ++logIdRef.current,
            message,
            type,
            timestamp: new Date(),
          },
        ];
        // Keep only last 500 entries
        if (newLogs.length > 500) {
          return newLogs.slice(-500);
        }
        return newLogs;
      });
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Set up device logging
  useEffect(() => {
    if (deviceRef.current) {
      deviceRef.current.onLog = (message: string, type: string) => {
        addLog(message, type as "info" | "success" | "error");
      };
    }
  }, [addLog]);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      addLog(
        "Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.",
        "error"
      );
      throw new Error("Web Bluetooth not supported");
    }

    try {
      await deviceRef.current?.connect();
      setIsConnected(true);
      await deviceRef.current?.sendInit();
    } catch (error) {
      addLog(`Connection failed: ${(error as Error).message}`, "error");
      setIsConnected(false);
      throw error;
    }
  }, [addLog]);

  const disconnect = useCallback(async () => {
    try {
      await deviceRef.current?.disconnect();
      setIsConnected(false);
    } catch (error) {
      addLog(`Disconnect failed: ${(error as Error).message}`, "error");
      throw error;
    }
  }, [addLog]);

  const sendStopCommand = useCallback(async () => {
    try {
      await deviceRef.current?.sendStopCommand();
      addLog("Workout stopped by user", "info");
    } catch (error) {
      addLog(`Failed to stop workout: ${(error as Error).message}`, "error");
      throw error;
    }
  }, [addLog]);

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
    []
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
    logs,
    addLog,
    clearLogs,
  };
}
