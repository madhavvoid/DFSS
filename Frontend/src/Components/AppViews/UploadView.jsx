function UploadView({ busy, isGoogle, isBackend, onChooseFiles, onDrop, error, notice, onDismissError, onDismissNotice }) {
  return (
    <section className="app-view upload-view">
      <div className="view-heading"><div><span className="view-kicker">ADD TO YOUR ARCHIVE</span><h1>Upload files</h1><p>Choose files from your device or drop them into the area below.</p></div></div>
      {error && <div className="notice notice-error" role="alert"><span>{error}</span><button type="button" onClick={onDismissError} aria-label="Dismiss error">×</button></div>}
      {notice && <div className="notice notice-success" role="status"><span>{notice}</span><button type="button" onClick={onDismissNotice} aria-label="Dismiss notice">×</button></div>}
      <div className="upload-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <div className="upload-glyph" aria-hidden="true">↑</div>
        <h2>{busy ? "Adding files…" : "Drop files to upload"}</h2>
        <p>Files are added to the root of your current vault.</p>
        <button className="solid-action" type="button" onClick={onChooseFiles} disabled={busy}><span aria-hidden="true">＋</span> Browse files</button>
      </div>
      <p className="upload-location">{isBackend ? "TPCM splits and replicates files across healthy storage nodes." : `Files will be saved to ${isGoogle ? "your connected Google Drive" : "browser storage on this device"}.`}</p>
    </section>
  );
}

export default UploadView;