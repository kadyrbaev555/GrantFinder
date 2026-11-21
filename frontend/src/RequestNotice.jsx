export default function RequestNotice({ message, loading = false, children }) {
  return (
    <div className="request-notice">
      <p role="status">
        {loading && <span className="spinner" aria-hidden="true" />}
        {message}
      </p>
      {children}
    </div>
  )
}
