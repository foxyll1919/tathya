/**
 * Component to render the list of all processed records
 */
export function createRecordList(records = [], activeRecordId = null) {
    if (records.length === 0) {
        return `<div class="record-list empty">No records processed yet.</div>`;
    }

    const items = records.map((rec) => {
        const isActive = rec.id === activeRecordId ? 'active' : '';
        return `
      <li class="record-item ${isActive}" data-id="${rec.id}">
        <span class="record-id">${rec.id}</span>
        <span class="record-status">${rec.status}</span>
      </li>
    `;
    }).join('');

    return `<ul class="record-list">${items}</ul>`;
}