// components/ConnectionSection.tsx - Device connection controls

import React from "react";

interface ConnectionSectionProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionSection({
  isConnected,
  onConnect,
  onDisconnect,
}: ConnectionSectionProps) {
  return (
    <div className="section">
      <h2>Connection</h2>
      <div className={`status ${isConnected ? "connected" : "disconnected"}`}>
        {isConnected ? "Connected" : "Disconnected"}
      </div>
      <div>
        <button onClick={onConnect} disabled={isConnected}>
          Connect to Device
        </button>
        <button
          className="secondary"
          onClick={onDisconnect}
          disabled={!isConnected}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
