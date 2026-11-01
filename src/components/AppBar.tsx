// components/AppBar.tsx - Top bar with brand, breadcrumb, and connection

import { ConnectionSection } from "./ConnectionSection";

interface AppBarProps {
  /** Name of the open exercise; omitted on the catalog. */
  exerciseName?: string;
  /** Navigation is locked while a set is running. */
  canNavigate: boolean;
  onShowCatalog: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function AppBar({
  exerciseName,
  canNavigate,
  onShowCatalog,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: AppBarProps) {
  return (
    <header className="app-bar">
      <span className="app-brand">🌿 Verano</span>
      {exerciseName && (
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb-divider">/</span>
          <button
            className="breadcrumb-link"
            onClick={onShowCatalog}
            disabled={!canNavigate}
            title={canNavigate ? undefined : "Stop the set to leave"}
          >
            Exercises
          </button>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-current">{exerciseName}</span>
        </nav>
      )}
      <span className="app-bar-spacer" />
      <ConnectionSection
        isConnected={isConnected}
        isConnecting={isConnecting}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
    </header>
  );
}
