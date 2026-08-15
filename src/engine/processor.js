/**
 * Pure Data Processing Logic for Tathya Engine
 */

import { createRecord, validateRecord } from '../models/index.js';

/**
 * Transforms incoming raw payloads into normalized records and applies business logic rules
 * @param {Object} rawInput 
 * @param {Object} options 
 * @returns {Object} Processed result containing record payload and execution metrics
 */
export function processPayload(rawInput, options = {}) {
    const startTime = performance.now();

    // Validate incoming payload schema
    const validation = validateRecord(rawInput);
    if (!validation.valid) {
        return {
            success: false,
            errors: validation.errors,
            record: null,
            executionTimeMs: performance.now() - startTime,
        };
    }

    // Create base normalized record
    const record = createRecord(rawInput);

    // Apply transformations based on options
    const transformedData = { ...record.data };

    if (options.sanitize) {
        Object.keys(transformedData).forEach((key) => {
            if (typeof transformedData[key] === 'string') {
                transformedData[key] = transformedData[key].trim();
            }
        });
    }

    const processedRecord = {
        ...record,
        data: transformedData,
        status: 'ready',
        processedAt: new Date().toISOString(),
    };

    return {
        success: true,
        errors: [],
        record: processedRecord,
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
    };
}

/**
 * Batch processes an array of data payloads
 * @param {Array<Object>} payloadArray 
 * @param {Object} options 
 * @returns {{ processed: Array, failed: Array, total: number }}
 */
export function processBatch(payloadArray = [], options = {}) {
    if (!Array.isArray(payloadArray)) {
        throw new TypeError('Input to processBatch must be an array.');
    }

    const processed = [];
    const failed = [];

    for (const item of payloadArray) {
        const result = processPayload(item, options);
        if (result.success) {
            processed.push(result.record);
        } else {
            failed.push({ input: item, errors: result.errors });
        }
    }

    return {
        processed,
        failed,
        total: payloadArray.length,
    };
}