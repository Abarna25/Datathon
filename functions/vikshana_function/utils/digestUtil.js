/**
 * digestUtil.js
 * Cryptographic SHA-256 document chain of custody integrity digest utility.
 */

const crypto = require('crypto');

/**
 * Calculates a standard 64-character uppercase hexadecimal SHA-256 digest
 * for document chain of custody verification.
 * 
 * @param {string} content - Raw document or docket text
 * @returns {string} 64-character hexadecimal SHA-256 hash string
 */
function calculateSHA256Digest(content) {
    if (typeof content !== 'string') {
        throw new TypeError('Content to digest must be a string.');
    }
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex').toUpperCase();
}

module.exports = {
    calculateSHA256Digest,
    computeSHA256: calculateSHA256Digest
};
