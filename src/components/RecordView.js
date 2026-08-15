/**
 * Component to display the currently active record details
 */
export function createRecordView(activeRecord) {
    if (!activeRecord) {
        return `<div class="record-view empty">No active record selected.</div>`;
    }

    return `
    <div class="record-view card">
      <h3>Record Detail: ${activeRecord.id}</h3>
      <p><strong>Status:</strong> <span class="badge ${activeRecord.status}">${activeRecord.status}</span></p>
      <p><strong>Timestamp:</strong> ${activeRecord.timestamp}</p>
      <div class="payload-preview">
        <pre><code>${JSON.stringify(activeRecord.data, null, 2)}</code></pre>
      </div>
    </div>
  `;
}