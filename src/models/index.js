/**
 * Core Data Models & Schema Contracts for Tathya
 */

// Baseline Schema Definition
export const RecordSchema = {
    id: '',
    timestamp: null,
    data: {},
    status: 'idle', // 'idle' | 'processing' | 'ready' | 'error'
};

/**
 * Validates incoming record payloads against expected schema types
 * @param {Object} payload 
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRecord(payload) {
    const errors = [];

    if (!payload || typeof payload !== 'object') {
        return { valid: false, errors: ['Payload must be a non-null object.'] };
    }

    if (payload.id !== undefined && typeof payload.id !== 'string' && typeof payload.id !== 'number') {
        errors.push('Field "id" must be a string or number.');
    }

    if (payload.status && !['idle', 'processing', 'ready', 'error'].includes(payload.status)) {
        errors.push(`Invalid status "${payload.status}". Must be idle, processing, ready, or error.`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Normalizes input data into a safe, valid Record structure
 * @param {Object} rawData 
 * @returns {Object} Normalized Record
 */
export function createRecord(rawData = {}) {
    const validation = validateRecord(rawData);
    if (!validation.valid) {
        console.warn('[Model Validation Warning]:', validation.errors);
    }

    return {
        id: rawData.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: rawData.timestamp || new Date().toISOString(),
        data: rawData.data || {},
        status: rawData.status || 'idle',
    };
}