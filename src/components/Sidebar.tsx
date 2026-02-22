// components/Sidebar.tsx - Sidebar component with mobile support

import { ConnectionSection } from "./ConnectionSection";
import { WorkoutSection } from "./WorkoutSection";
import { WorkoutConfig } from "../lib/types";

interface SidebarProps {
  isOpen: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartWorkout: (config: WorkoutConfig) => void;
}

export function Sidebar({
  isOpen,
  isConnected,
  onConnect,
  onDisconnect,
  onStartWorkout,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h1>Verano</h1>
        <p>Web Bluetooth Interface</p>
      </div>

      <div className="sidebar-content">
        <ConnectionSection
          isConnected={isConnected}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />

        <WorkoutSection
          isConnected={isConnected}
          onStartWorkout={onStartWorkout}
        />
      </div>
    </aside>
  );
}
