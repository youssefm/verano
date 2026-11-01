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
      ? "Connected"
      : "Connect trainer";

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      disabled={isConnecting}
      aria-label={isConnected ? "Disconnect trainer" : undefined}
      title={
        isConnected ? "Trainer connected — click to disconnect" : undefined
      }
    >
      <span className="conn-dot" />
      <span className="conn-label">{label}</span>
    </button>
  );
}
