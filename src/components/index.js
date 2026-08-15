/**
 * UI Presentation Layer & Engine Integration for Tathya
 */

import { store, dispatchRecord } from '../engine/index.js';
import { createRecordView } from './RecordView.js';
import { createRecordList } from './RecordList.js';
import { createControls } from './Controls.js';

export { createRecordView, createRecordList, createControls };

/**
 * Initializes reactive bindings between DOM elements and the Engine Store
 * @param {HTMLElement} container 
 */
export function renderApp(container) {
    if (!container) {
        console.error('[UI Engine Error]: Target container element not found.');
        return;
    }

    // Initial structure render
    container.innerHTML = `
    <div class="tathya-app-layout">
      <header class="app-header">
        <h2>Tathya UI Dashboard</h2>
      </header>
      <main class="app-content">
        <aside class="sidebar">
          <h3>Record History</h3>
          <div id="ui-record-list"></div>
        </aside>
        <section class="main-panel">
          <div id="ui-controls-container"></div>
          <div id="ui-record-view"></div>
        </section>
      </main>
    </div>
  `;

    // Render static controls
    const controlsSlot = container.querySelector('#ui-controls-container');
    controlsSlot.innerHTML = createControls();

    // Attach DOM event listeners for controls
    const dispatchBtn = container.querySelector('#btn-dispatch-sample');
    if (dispatchBtn) {
        dispatchBtn.addEventListener('click', () => {
            dispatchRecord({
                data: {
                    label: 'Sample User Entry',
                    timestamp: Date.now(),
                },
            });
        });
    }

    const clearBtn = container.querySelector('#btn-clear-records');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            store.setState({ records: [], activeRecordId: null, status: 'idle' });
        });
    }

    // Update dynamic component views based on current state snapshot
    const updateUI = (state) => {
        const listSlot = container.querySelector('#ui-record-list');
        const viewSlot = container.querySelector('#ui-record-view');

        const activeRecord = state.records.find((r) => r.id === state.activeRecordId);

        listSlot.innerHTML = createRecordList(state.records, state.activeRecordId);
        viewSlot.innerHTML = createRecordView(activeRecord);
    };

    // 1. Initial view render
    updateUI(store.getState());

    // 2. Subscribe updateUI to reactive store changes
    const unsubscribe = store.subscribe((newState) => {
        updateUI(newState);
    });

    return unsubscribe;
}