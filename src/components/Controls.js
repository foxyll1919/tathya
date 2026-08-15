/**
 * Controls panel component for dispatching new payloads
 */
export function createControls() {
    return `
    <div class="controls-panel">
      <button id="btn-dispatch-sample" class="btn primary">Dispatch Sample Record</button>
      <button id="btn-clear-records" class="btn danger">Clear State</button>
    </div>
  `;
}