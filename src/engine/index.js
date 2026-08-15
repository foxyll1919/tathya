/**
 * Tathya Engine Public API Entry Point
 */

import { store } from './state.js';
import { processPayload, processBatch } from './processor.js';

export { store, processPayload, processBatch };

/**
 * High-level method to process payload and automatically commit to engine state
 * @param {Object} rawInput 
 * @param {Object} options 
 */
export function dispatchRecord(rawInput, options = {}) {
    store.setState({ status: 'processing', error: null });

    const result = processPayload(rawInput, options);

    if (!result.success) {
        store.setState({ status: 'error', error: result.errors });
        return result;
    }

    store.setState((prevState) => ({
        records: [...prevState.records, result.record],
        activeRecordId: result.record.id,
        status: 'idle',
        error: null,
    }));

    return result;
}