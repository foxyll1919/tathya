/**
 * Lightweight State & Event Controller for Tathya Engine
 */

class EngineStore {
    constructor(initialState = {}) {
        this.state = {
            records: [],
            activeRecordId: null,
            status: 'idle', // 'idle' | 'processing' | 'error'
            error: null,
            ...initialState,
        };
        this.listeners = new Set();
    }

    /**
     * Returns a copy of the current state snapshot
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Updates state and notifies all subscribers
     * @param {Object|Function} update 
     */
    setState(update) {
        const nextState = typeof update === 'function' ? update(this.state) : update;
        this.state = { ...this.state, ...nextState };
        this.notify();
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener 
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function.');
        }
        this.listeners.add(listener);

        // Return unsubscribe cleanup function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Emits state update to all registered listeners
     */
    notify() {
        const snapshot = this.getState();
        this.listeners.forEach((listener) => {
            try {
                listener(snapshot);
            } catch (err) {
                console.error('[EngineStore Listener Error]:', err);
            }
        });
    }
}

// Global store instance singleton
export const store = new EngineStore();
export { EngineStore };