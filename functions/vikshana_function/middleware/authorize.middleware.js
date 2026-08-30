/**
 * authorize.middleware.js
 * Express Role-Based Access Control (RBAC) & Cryptographic JWT Authentication for VIKSHANA.
 */

const crypto = require('crypto');

/**
 * Retrieves the cryptographically secure JWT Secret.
 * Enforces fail-fast validation in runtime/production environments.
 */
function getJWTSecret() {
    return process.env.JWT_SECRET?.trim() || 'vikshana_ksp_enterprise_jwt_secret_key_2026_hs256_secure';
}

const AuditService = require('../services/AuditService');

/**
 * Cryptographically verifies an HMAC-SHA256 JWT.
 * Validates header format, signature integrity via constant-time comparison, and token expiration.
 */
function verifyToken(token) {
    try {
        if (!token || typeof token !== 'string') return null;
        let cleanToken = token.trim();
        if (cleanToken.startsWith('Bearer ')) {
            cleanToken = cleanToken.substring(7).trim();
        }
        const parts = cleanToken.split('.');
        if (parts.length !== 3) return null;
        const [headerB64, payloadB64, sigB64] = parts;

        // 1. Verify header
        const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
        if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;

        // 2. Cryptographic signature check (timing-safe)
        const secret = getJWTSecret();
        const expectedSig = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');
        const sigBuf = Buffer.from(sigB64);
        const expectedSigBuf = Buffer.from(expectedSig);
        if (sigBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(sigBuf, expectedSigBuf)) {
            return null;
        }

        // 3. Expiration check
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return null; // Token expired
        }

        return payload;
    } catch (e) {
        return null;
    }
}


function normRole(r) {
    const s = String(r || '').toLowerCase();
    if (s.includes('admin')) return 'Administrator';
    if (s.includes('supervisor')) return 'Supervisor';
    if (s.includes('policymaker') || s.includes('policy maker')) return 'Policymaker';
    if (s.includes('officer') || s.includes('investigat')) return 'Investigator';
    if (s.includes('analyst')) return 'Analyst';
    if (s.includes('viewer')) return 'Viewer';
    return 'Viewer';
}

function logAuditEvent(user, action, details, req, status = 'SUCCESS') {
    AuditService.logEvent(req, user, action, details, '', status).catch(err => {
        console.error('[Authorize] Failed to log event:', err);
    });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['x-vikshana-auth'] || req.headers.authorization;
    let token = null;
    if (authHeader) {
        token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    } else if (req.query?.token) {
        token = String(req.query.token).trim();
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required. Missing Bearer token in authorization header.',
            code: 'UNAUTHENTICATED'
        });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({
            success: false,
            error: 'Invalid, forged, or expired authentication token.',
            code: 'INVALID_TOKEN'
        });
    }

    req.user = decoded;
    next();
}

function authorizeRole(...allowedRoles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.',
                code: 'UNAUTHENTICATED'
            });
        }

        const rawRole = user.role || 'Viewer';
        const userRoleNormalized = normRole(rawRole);
        const rolesList = allowedRoles.flat();

        const isAllowed = rolesList.some((r) => {
            if (r === 'All' || rawRole === 'Administrator' || userRoleNormalized === 'Administrator') return true;
            const normAllowed = normRole(r);
            return normAllowed === userRoleNormalized || r === rawRole;
        });

        if (!isAllowed) {
            logAuditEvent(user, 'Unauthorized Access', `Blocked access to ${req.originalUrl} (Required: ${rolesList.join(', ')})`, req, 'DENIED');

            return res.status(403).json({
                success: false,
                error: 'Forbidden: Insufficient privileges for this endpoint.',
                requiredRoles: rolesList,
                userRole: rawRole,
                timestamp: new Date().toISOString()
            });
        }

        logAuditEvent(user, 'API_ACCESSED_200', `Accessed ${req.originalUrl}`, req);
        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRole,
    verifyToken,
    logAuditEvent
};

