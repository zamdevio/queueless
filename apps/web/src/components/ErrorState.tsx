interface ErrorStateProps {
  title?: string;
  message: string;
  retryable?: boolean;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  retryable = true,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="error-panel" role="alert">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <h2 className="error-title">{title}</h2>
        <p className="error-message">{message}</p>
      </div>
      {retryable && onRetry && (
        <button className="btn-primary error-retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
