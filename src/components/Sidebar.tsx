// components/Sidebar.tsx - Sidebar component with mobile support

import React from "react";
import { ConnectionSection } from "./ConnectionSection";
import { ProgramSection } from "./ProgramSection";
import { EchoSection } from "./EchoSection";
import { ConfigSection } from "./ConfigSection";
import { ProgramModeType, EchoLevelType } from "../modes";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartProgram: (
    mode: ProgramModeType,
    weight: number,
    reps: number,
    progression: number,
    isJustLift: boolean
  ) => void;
  onStartEcho: (
    level: EchoLevelType,
    eccentricPct: number,
    targetReps: number,
    isJustLift: boolean
  ) => void;
  stopAtTop: boolean;
  onStopAtTopChange: (value: boolean) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  isConnected,
  onConnect,
  onDisconnect,
  onStartProgram,
  onStartEcho,
  stopAtTop,
  onStopAtTopChange,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h1>Vitruvian Control</h1>
        <p>Web Bluetooth Interface</p>
      </div>

      <div className="sidebar-content">
        <ConnectionSection
          isConnected={isConnected}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />

        <ProgramSection
          isConnected={isConnected}
          onStartProgram={onStartProgram}
        />

        <EchoSection isConnected={isConnected} onStartEcho={onStartEcho} />

        <ConfigSection
          stopAtTop={stopAtTop}
          onStopAtTopChange={onStopAtTopChange}
        />
      </div>
    </aside>
  );
}
