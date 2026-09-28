'use strict';

const NodeCache = require('node-cache');

// Initialize NodeCache with a default TTL of 5 minutes (300 seconds)
const _cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/** Returns cached value if exists, otherwise null. */
const get = (key) => {
    return _cache.get(key) || null;
};

/** Stores value with optional TTL (in seconds). */
const set = (key, data, ttlSeconds = 300) => {
    _cache.set(key, data, ttlSeconds);
};

/** Invalidates one or more keys (all if none specified). */
const invalidate = (...keys) => {
    if (keys.length === 0) {
        _cache.flushAll();
    } else {
        keys.forEach(k => _cache.del(k));
    }
};

/** Invalidate all keys matching a prefix. */
const invalidatePrefix = (prefix) => {
    const keys = _cache.keys();
    const keysToDelete = keys.filter(k => k.startsWith(prefix));
    _cache.del(keysToDelete);
};

module.exports = { get, set, invalidate, invalidatePrefix };
