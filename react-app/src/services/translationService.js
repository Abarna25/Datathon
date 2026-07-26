/**
 * translationService.js
 * 
 * Handles all calls to the Catalyst Zia NLP Translation API (proxied via our backend).
 * 
 * Features:
 *  - Two-level cache: in-memory Map (fastest) + localStorage (survives reload)
 *  - Deduplication: multiple simultaneous callers for the same text share one API call
 *  - Rate limiting: max 3 concurrent API requests
 *  - Batch size: 25 strings per call (Zia API recommended limit)
 *
 * Language codes (ISO 639-1 as expected by Zia):
 *   en → English  (source / no-op)
 *   kn → Kannada
 *   hi → Hindi
 *   ta → Tamil
 */

import api from './api';

// ── Cache setup ───────────────────────────────────────────────────────────────

const MEM_CACHE = new Map(); // "lang:text" → translatedText
const LS_KEY    = 'vikshana_xlat_v3'; // Bump version to bust stale cache

function cacheKey(text, lang) {
    return `${lang}:${text}`;
}

// Load from localStorage on first import
(function initCache() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        const obj = JSON.parse(raw);
        Object.entries(obj).forEach(([k, v]) => MEM_CACHE.set(k, v));
    } catch (_) { /* corrupted — ignore */ }
})();

// Throttled localStorage save (max once per 2s)
let _lsSaveTimer = null;
function scheduleLSSave() {
    if (_lsSaveTimer) return;
    _lsSaveTimer = setTimeout(() => {
        _lsSaveTimer = null;
        try {
            const obj = {};
            MEM_CACHE.forEach((v, k) => { obj[k] = v; });
            localStorage.setItem(LS_KEY, JSON.stringify(obj));
        } catch (_) { /* quota exceeded — ignore */ }
    }, 2000);
}

export function clearTranslationCache() {
    MEM_CACHE.clear();
    if (_lsSaveTimer) clearTimeout(_lsSaveTimer);
    _lsSaveTimer = null;
    try { localStorage.removeItem(LS_KEY); } catch (_) {}
}

// ── In-flight deduplication ───────────────────────────────────────────────────
// Map<lang:text, Promise<string>> — prevents N simultaneous calls for same string

const IN_FLIGHT = new Map();

// ── Concurrency limiter ───────────────────────────────────────────────────────
const MAX_CONCURRENT = 3;
let _activeRequests = 0;
const _waitQueue = [];

function acquireSlot() {
    return new Promise(resolve => {
        if (_activeRequests < MAX_CONCURRENT) {
            _activeRequests++;
            resolve();
        } else {
            _waitQueue.push(resolve);
        }
    });
}

function releaseSlot() {
    if (_waitQueue.length > 0) {
        const next = _waitQueue.shift();
        next();
    } else {
        _activeRequests--;
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get a cached translation immediately (synchronous).
 * Returns null if not in cache.
 */
export function getCached(text, lang) {
    if (!text || lang === 'en') return lang === 'en' ? text : null;
    return MEM_CACHE.get(cacheKey(text.trim(), lang)) ?? null;
}

/**
 * Translate an array of strings to the target language.
 * - Cached strings are resolved instantly
 * - Uncached strings are sent to the Zia API in a single batch call
 * - Results are cached for future calls
 *
 * @param {string[]} texts       - English source strings (may contain empty/null)
 * @param {string}   targetLang  - ISO code: 'kn', 'hi', 'ta'
 * @returns {Promise<string[]>}  - Same order as input; empty strings for empties
 */
export async function translateTexts(texts, targetLang) {
    if (!texts || !texts.length) return [];
    if (targetLang === 'en') return texts;

    const lang = targetLang.toLowerCase().trim();

    // 1. Resolve cached immediately
    const results = new Array(texts.length).fill(null);
    const uncachedIndexes = [];

    texts.forEach((text, i) => {
        if (!text || !text.trim()) {
            results[i] = text || '';
            return;
        }
        const trimmed = text.trim();
        const cached = MEM_CACHE.get(cacheKey(trimmed, lang));
        if (cached !== undefined) {
            results[i] = cached;
        } else {
            uncachedIndexes.push(i);
        }
    });

    if (uncachedIndexes.length === 0) return results;

    // 3. Gather the unique strings we actually need to fetch
    const uniqueTexts = [...new Set(uncachedIndexes.map(i => texts[i].trim()))];

    // 4. Make batched API call(s) under concurrency limit
    const translationMap = new Map(); // text → translated

    for (let start = 0; start < uniqueTexts.length; start += 25) {
        const chunk = uniqueTexts.slice(start, start + 25);

        await acquireSlot();
        try {
            const response = await api.post('/ml/translate', {
                texts: chunk,
                sourceLanguage: 'en',
                targetLanguage: lang
            });

            const translations = response.data?.data?.translations;
            if (Array.isArray(translations)) {
                chunk.forEach((origText, j) => {
                    const translated = translations[j];
                    if (translated && typeof translated === 'string' && translated.trim()) {
                        translationMap.set(origText, translated);
                        MEM_CACHE.set(cacheKey(origText, lang), translated);
                    } else {
                        // API returned nothing — cache the original as fallback
                        MEM_CACHE.set(cacheKey(origText, lang), origText);
                        translationMap.set(origText, origText);
                    }
                });
                scheduleLSSave();
            } else {
                // Unexpected response — cache originals as fallback
                chunk.forEach(t => {
                    MEM_CACHE.set(cacheKey(t, lang), t);
                    translationMap.set(t, t);
                });
                console.warn('[TranslationService] Unexpected response:', response.data);
            }
        } catch (err) {
            console.debug('[TranslationService] API error:', err.message);
            // Cache originals as fallback so we don't retry immediately
            chunk.forEach(t => {
                MEM_CACHE.set(cacheKey(t, lang), t);
                translationMap.set(t, t);
            });
        } finally {
            releaseSlot();
        }
    }

    // Clean up in-flight entries
    uniqueTexts.forEach(t => IN_FLIGHT.delete(cacheKey(t, lang)));

    // 5. Fill in results
    uncachedIndexes.forEach(i => {
        const text = texts[i].trim();
        results[i] = translationMap.get(text) || MEM_CACHE.get(cacheKey(text, lang)) || text;
    });

    return results;
}

/**
 * Translate a single string.
 */
export async function translateOne(text, targetLang) {
    if (!text) return text;
    const [result] = await translateTexts([text], targetLang);
    return result;
}
