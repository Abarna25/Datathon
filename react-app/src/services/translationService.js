/**
 * translationService.js
 * 
 * Handles translation using multi-tier architecture:
 *  1. Immediate Built-in Comprehensive Dictionary (instant offline Kannada & Hindi)
 *  2. In-memory Map cache + LocalStorage (survives page reloads)
 *  3. Backend Zia NLP / LLM Translation Proxy (for dynamic DB content)
 */

import api from './api';

// ── Built-in Comprehensive Dictionary ──────────────────────────────────────────
const OFFLINE_DICTIONARY = {
    kn: {
        'Dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
        'VIKSHANA Sentinel': 'ವೀಕ್ಷಣಾ ಸೆಂಟಿನೆಲ್',
        'Investigation Workspace': 'ತನಿಖಾ ಕ್ಷೇತ್ರ',
        'Forensic Intelligence Hub': 'ವಿಧಿವಿಜ್ಞಾನ ಗುಪ್ತಚರ ಕೇಂದ್ರ',
        'Investigation Search': 'ತನಿಖಾ ಹುಡುಕಾಟ',
        'Sociological Insights': 'ಸಾಮಾಜಿಕ ಒಳನೋಟಗಳು',
        'Crime Forecasting': 'ಅಪರಾಧ ಮುನ್ಸೂಚನೆ',
        'Investigation Report': 'ತನಿಖಾ ವರದಿ',
        'Audit Logs': 'ಆಡಿಟ್ ಲಾಗ್‌ಗಳು',
        'PRIMARY ACTIONS': 'ಪ್ರಾಥಮಿಕ ಕ್ರಮಗಳು',
        'INTELLIGENCE': 'ಗುಪ್ತಚರ',
        'ADMIN & REPORTING': 'ಆಡಳಿತ ಮತ್ತು ವರದಿ',
        'ROLE: ADMINISTRATOR': 'ಪಾತ್ರ: ನಿರ್ವಾಹಕ',
        'ROLE: INVESTIGATOR': 'ಪಾತ್ರ: ತನಿಖಾಧಿಕಾರಿ',
        'ROLE: SUPERVISOR': 'ಪಾತ್ರ: ಮೇಲ್ವಿಚಾರಕ',
        'ROLE: ANALYST': 'ಪಾತ್ರ: ವಿಶ್ಲೇಷಕ',
        'ROLE: POLICYMAKER': 'ಪಾತ್ರ: ನೀತಿ ನಿರೂಪಕ',
        'ROLE: OFFICER': 'ಪಾತ್ರ: ಅಧಿಕಾರಿ',
        'ROLE: Administrator': 'ಪಾತ್ರ: ನಿರ್ವಾಹಕ',
        'ROLE: Investigator': 'ಪಾತ್ರ: ತನಿಖಾಧಿಕಾರಿ',
        'ROLE: Supervisor': 'ಪಾತ್ರ: ಮೇಲ್ವಿಚಾರಕ',
        'ROLE: Analyst': 'ಪಾತ್ರ: ವಿಶ್ಲೇಷಕ',
        'ROLE: Policymaker': 'ಪಾತ್ರ: ನೀತಿ ನಿರೂಪಕ',
        'ROLE: Officer': 'ಪಾತ್ರ: ಅಧಿಕಾರಿ',
        'Administrator': 'ನಿರ್ವಾಹಕ',
        'Investigator': 'ತನಿಖಾಧಿಕಾರಿ',
        'Supervisor': 'ಮೇಲ್ವಿಚಾರಕ',
        'Analyst': 'ವಿಶ್ಲೇಷಕ',
        'Policymaker': 'ನೀತಿ ನಿರೂಪಕ',
        'Officer': 'ಅಧಿಕಾರಿ',
        'Viewer': 'ವೀಕ್ಷಕ',
        'Active Investigation': 'ಸಕ್ರಿಯ ತನಿಖೆ',
        'Active Case': 'ಸಕ್ರಿಯ ಪ್ರಕರಣ',
        'Active Case ID:': 'ಸಕ್ರಿಯ ಪ್ರಕರಣ ಐಡಿ:',
        'Refresh': 'ನವೀಕರಿಸಿ',
        'All Cases (Global View)': 'ಎಲ್ಲಾ ಪ್ರಕರಣಗಳು (ಜಾಗತಿಕ ನೋಟ)',
        '🌐 All Cases (Global View)': '🌐 ಎಲ್ಲಾ ಪ್ರಕರಣಗಳು (ಜಾಗತಿಕ ನೋಟ)',
        'Search everywhere (Cases, FIRs, Entities)...': 'ಎಲ್ಲಾ ಕಡೆ ಹುಡುಕಿ (ಪ್ರಕರಣಗಳು, ಎಫ್‌ಐಆರ್, ವ್ಯಕ್ತಿಗಳು)...',
        'Multi-Modal Forensic & Intelligence Hub': 'ಬಹು-ಮಾದರಿ ವಿಧಿವಿಜ್ಞಾನ ಮತ್ತು ಗುಪ್ತಚರ ಕೇಂದ್ರ',
        'Unified data layer covering 10 operational forensic domains, Vector-RAG retrieval, and Scikit-Learn Python ML.': '10 ಕಾರ್ಯಾಚರಣಾ ವಿಧಿವಿಜ್ಞಾನ ಕ್ಷೇತ್ರಗಳು, ವೆಕ್ಟರ್-RAG ಮರುಪಡೆಯುವಿಕೆ ಮತ್ತು Scikit-Learn ಪೈಥಾನ್ ML ಅನ್ನು ಒಳಗೊಂಡಿರುವ ಏಕೀಕೃತ ಡೇಟಾ ಶ್ರೇಣಿ.',
        'Evidence & Chain of Custody': 'ಸಾಕ್ಷ್ಯ ಮತ್ತು ಪಾಲನೆಯ ಸರಪಳಿ',
        'CCTV Surveillance': 'ಸಿಸಿಟಿವಿ ಕಣ್ಗಾವಲು',
        'CDR Phone Intelligence': 'ಸಿಡಿಆರ್ ಫೋನ್ ಗುಪ್ತಚರ',
        'Financial Intelligence': 'ಹಣಕಾಸು ಗುಪ್ತಚರ',
        'Forensic Lab Reports': 'ವಿಧಿವಿಜ್ಞಾನ ಪ್ರಯೋಗಾಲಯ ವರದಿಗಳು',
        'Weapons & Ballistics': 'ಆಯುಧಗಳು ಮತ್ತು ಬ್ಯಾಲಿಸ್ಟಿಕ್ಸ್',
        'Vehicle Seizures': 'ವಾಹನ ಜಪ್ತಿಗಳು',
        'Biometrics & DNA': 'ಬಯೋಮೆಟ್ರಿಕ್ಸ್ ಮತ್ತು ಡಿಎನ್‌ಎ',
        'Court Proceedings': 'ನ್ಯಾಯಾಲಯದ ಕಲಾಪಗಳು',
        'Interrogations': 'ವಿಚಾರಣೆಗಳು',
        'Semantic Vector RAG': 'ಸೆಮ್ಯಾಂಟಿಕ್ ವೆಕ್ಟರ್ RAG',
        'Python ML Pipeline': 'ಪೈಥಾನ್ ML ಪೈಪ್‌ಲೈನ್',
        'Physical Evidence & Chain of Custody': 'ಭೌತಿಕ ಸಾಕ್ಷ್ಯ ಮತ್ತು ಪಾಲನೆಯ ಸರಪಳಿ',
        'Record Evidence': 'ಸಾಕ್ಷ್ಯ ದಾಖಲಿಸಿ',
        'Physical Weapon': 'ಭೌತಿಕ ಆಯುಧ',
        'Fingerprint Lift Card': 'ಬೆರಳಚ್ಚು ಕಾರ್ಡ್',
        'Blood / Biological Swab': 'ರಕ್ತ / ಜೈವಿಕ ಸ್ವ್ಯಾಬ್',
        'Digital Media / Flash Drive': 'ಡಿಜಿಟಲ್ ಮಾಧ್ಯಮ / ಫ್ಲ್ಯಾಶ್ ಡ್ರೈವ್',
        'Narcotic Substance': 'ಮಾದಕ ವಸ್ತು',
        'Documentary Evidence': 'ದಾಖಲಾತಿ ಸಾಕ್ಷ್ಯ',
        'Description of item...': 'ವಸ್ತುವಿನ ವಿವರಣೆ...',
        'HQ Vault A-12': 'ಪ್ರಧಾನ ಕಚೇರಿ ಕಪಾಟು A-12',
        'recorded items': 'ದಾಖಲಾದ ವಸ್ತುಗಳು',
        'Evidence ID': 'ಸಾಕ್ಷ್ಯ ಐಡಿ',
        'Type': 'ವಿಧ',
        'Description': 'ವಿವರಣೆ',
        'Storage Location': 'ಸಂಗ್ರಹ ಸ್ಥಳ',
        'SHA-256 Hash': 'SHA-256 ಹ್ಯಾಶ್',
        'Chain of Custody': 'ಪಾಲನೆಯ ಸರಪಳಿ',
        'Command Center Idle': 'ಕಮಾಂಡ್ ಸೆಂಟರ್ ಸಿದ್ಧವಾಗಿದೆ',
        'Case Overview': 'ಪ್ರಕರಣದ ಅವಲೋಕನ',
        'Evidence Intelligence': 'ಸಾಕ್ಷ್ಯ ಗುಪ್ತಚರ',
        'Timeline Intelligence': 'ಸಮಯರೇಖೆ ಗುಪ್ತಚರ',
        'Historical Intelligence': 'ಐತಿಹಾಸಿಕ ಗುಪ್ತಚರ',
        'Relationships': 'ಸಂಬಂಧಗಳು',
        'Decision Support': 'ನಿರ್ಧಾರ ಬೆಂಬಲ',
        'VIKSHANA Copilot': 'ವೀಕ್ಷಣಾ ಕೋಪೈಲಟ್',
        'Good Evening, Officer.': 'ಶುಭ ಸಂಜೆ, ಅಧಿಕಾರಿಗಳೇ.',
        'Good Morning, Officer.': 'ಶುಭೋದಯ, ಅಧಿಕಾರಿಗಳೇ.',
        'Good Afternoon, Officer.': 'ಶುಭ ಮಧ್ಯಾಹ್ನ, ಅಧಿಕಾರಿಗಳೇ.',
        'Active': 'ಸಕ್ರಿಯ',
        'Closed': 'ಮುಕ್ತಾಯಗೊಂಡಿದೆ',
        'Under Investigation': 'ತನಿಖೆಯಲ್ಲಿದೆ',
        'High': 'ಹೆಚ್ಚು',
        'Medium': 'ಮಧ್ಯಮ',
        'Low': 'ಕಡಿಮೆ',
        'Loading...': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
        'Error': 'ದೋಷ',
        'Success': 'ಯಶಸ್ಸು',
        'Retry': 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
        'Logout': 'ನಿರ್ಗಮಿಸಿ',
        'TRIAGE': 'ವಿಂಗಡಣೆ',
        'FIR Intelligence': 'ಎಫ್‌ಐಆರ್ ಗುಪ್ತಚರ',
        'Investigation Leads': 'ತನಿಖಾ ಮುನ್ನಡೆಗಳು',
        'MO Profile': 'ಅಪರಾಧ ವಿಧಾನ (MO)',
        'Evidence Integrity': 'ಸಾಕ್ಷ್ಯ ಸಮಗ್ರತೆ',
        'Predictive ML': 'ಭವಿಷ್ಯಸೂಚಕ ML'
    },
    hi: {
        'Dashboard': 'डैशबोर्ड',
        'VIKSHANA Sentinel': 'वीक्षणा सेंटिनल',
        'Investigation Workspace': 'जांच कार्यक्षेत्र',
        'Forensic Intelligence Hub': 'फोरेंसिक इंटेलिजेंस हब',
        'Investigation Search': 'जांच खोज',
        'Sociological Insights': 'सामाजिक अंतर्दृष्टि',
        'Crime Forecasting': 'अपराध पूर्वानुमान',
        'Investigation Report': 'जांच रिपोर्ट',
        'Audit Logs': 'ऑडिट लॉग',
        'PRIMARY ACTIONS': 'प्राथमिक क्रियाएं',
        'INTELLIGENCE': 'इंटेलिजेंस',
        'ADMIN & REPORTING': 'प्रशासन और रिपोर्टिंग',
        'Administrator': 'प्रशासक',
        'Investigator': 'जांचकर्ता',
        'Supervisor': 'पर्यवेक्षक',
        'Analyst': 'विश्लेषक',
        'Policymaker': 'नीति निर्माता',
        'Officer': 'अधिकारी',
        'Viewer': 'दर्शक',
        'Active Case ID:': 'सक्रिय मामला आईडी:',
        'Refresh': 'ताज़ा करें',
        'Record Evidence': 'साक्ष्य दर्ज करें',
        'Evidence ID': 'साक्ष्य आईडी',
        'Type': 'प्रकार',
        'Description': 'विवरण',
        'Storage Location': 'भंडारण स्थान',
        'Chain of Custody': 'अभिरक्षा श्रृंखला'
    }
};

// ── Cache setup ───────────────────────────────────────────────────────────────
const MEM_CACHE = new Map(); // "lang:text" → translatedText
const LS_KEY    = 'vikshana_xlat_v4'; // Cache key

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

// Throttled localStorage save
let _lsSaveTimer = null;
function scheduleLSSave() {
    if (_lsSaveTimer) return;
    _lsSaveTimer = setTimeout(() => {
        _lsSaveTimer = null;
        try {
            const obj = {};
            MEM_CACHE.forEach((v, k) => { obj[k] = v; });
            localStorage.setItem(LS_KEY, JSON.stringify(obj));
        } catch (_) { /* ignore */ }
    }, 2000);
}

export function clearTranslationCache() {
    MEM_CACHE.clear();
    if (_lsSaveTimer) clearTimeout(_lsSaveTimer);
    _lsSaveTimer = null;
    try { localStorage.removeItem(LS_KEY); } catch (_) {}
}

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
 * Get a cached or dictionary translation immediately (synchronous).
 */
export function getCached(text, lang) {
    if (!text || lang === 'en') return lang === 'en' ? text : null;
    const trimmed = text.trim();
    
    // Check dictionary first
    if (OFFLINE_DICTIONARY[lang] && OFFLINE_DICTIONARY[lang][trimmed]) {
        return OFFLINE_DICTIONARY[lang][trimmed];
    }
    
    return MEM_CACHE.get(cacheKey(trimmed, lang)) ?? null;
}

/**
 * Translate an array of strings to the target language.
 */
export async function translateTexts(texts, targetLang) {
    if (!texts || !texts.length) return [];
    if (targetLang === 'en') return texts;

    const lang = targetLang.toLowerCase().trim();
    const results = new Array(texts.length).fill(null);
    const uncachedIndexes = [];

    // 1. Resolve dictionary or memory cache immediately
    texts.forEach((text, i) => {
        if (!text || !text.trim()) {
            results[i] = text || '';
            return;
        }
        const trimmed = text.trim();
        if (OFFLINE_DICTIONARY[lang] && OFFLINE_DICTIONARY[lang][trimmed]) {
            results[i] = OFFLINE_DICTIONARY[lang][trimmed];
            return;
        }
        const cached = MEM_CACHE.get(cacheKey(trimmed, lang));
        if (cached !== undefined) {
            results[i] = cached;
        } else {
            uncachedIndexes.push(i);
        }
    });

    if (uncachedIndexes.length === 0) return results;

    // 2. Fetch uncached strings in batches from backend
    const uniqueTexts = [...new Set(uncachedIndexes.map(i => texts[i].trim()))];
    const translationMap = new Map();

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
                        const dictFallback = OFFLINE_DICTIONARY[lang]?.[origText] || origText;
                        MEM_CACHE.set(cacheKey(origText, lang), dictFallback);
                        translationMap.set(origText, dictFallback);
                    }
                });
                scheduleLSSave();
            } else {
                chunk.forEach(t => {
                    const dictFallback = OFFLINE_DICTIONARY[lang]?.[t] || t;
                    MEM_CACHE.set(cacheKey(t, lang), dictFallback);
                    translationMap.set(t, dictFallback);
                });
            }
        } catch (err) {
            chunk.forEach(t => {
                const dictFallback = OFFLINE_DICTIONARY[lang]?.[t] || t;
                MEM_CACHE.set(cacheKey(t, lang), dictFallback);
                translationMap.set(t, dictFallback);
            });
        } finally {
            releaseSlot();
        }
    }

    // 3. Fill in results
    uncachedIndexes.forEach(i => {
        const text = texts[i].trim();
        results[i] = translationMap.get(text) || MEM_CACHE.get(cacheKey(text, lang)) || OFFLINE_DICTIONARY[lang]?.[text] || text;
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
