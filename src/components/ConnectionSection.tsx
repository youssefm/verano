// components/ConnectionSection.tsx - Device connection controls

interface ConnectionSectionProps {
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionSection({
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: ConnectionSectionProps) {
  const handleClick = () => {
    if (isConnecting) return;
    if (isConnected) {
      onDisconnect();
    } else {
      onConnect();
    }
  };

  const buttonClass = isConnecting
    ? "conn-btn connecting"
    : isConnected
      ? "conn-btn connected"
      : "conn-btn disconnected";

  const label = isConnecting
    ? "Connecting…"
    : isConnected
      ? "Disconnect"
      : "Connect";

  return (
    <div className="section connection-section">
      <button
        className={buttonClass}
        onClick={handleClick}
        disabled={isConnecting}
      >
        <span className="conn-dot" />
        {label}
      </button>
    </div>
  );
}
