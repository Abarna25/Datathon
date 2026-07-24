/**
 * AuthController.js
 * Predefined-user authentication for VIKSHANA hackathon demo.
 * JWT session tokens + role-based access. All other modules remain on live Catalyst data.
 */

const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'vikshana-catalyst-secret-key-2026';

// ── Predefined hackathon users ───────────────────────────────────────────────
const USERS = [
    { id: 'admin',        username: 'admin',        password: 'admin123',        role: 'Administrator', name: 'System Administrator',  department: 'HQ Command',    aliases: ['admin@vikshana.ai', 'administrator'] },
    { id: 'investigator', username: 'investigator', password: 'investigator123', role: 'Investigator',  name: 'Investigation Officer', department: 'Field Ops',     aliases: ['investigator@vikshana.ai'] },
    { id: 'analyst',      username: 'analyst',      password: 'analyst123',      role: 'Analyst',       name: 'Crime Analyst',         department: 'Intelligence',  aliases: ['analyst@vikshana.ai'] },
    { id: 'supervisor',   username: 'supervisor',   password: 'supervisor123',   role: 'Supervisor',    name: 'Police Supervisor',     department: 'Oversight',     aliases: ['supervisor@vikshana.ai'] },
    { id: 'policymaker',  username: 'policymaker',  password: 'policy123',       role: 'Policymaker',   name: 'Policy Advisor',        department: 'Strategy',      aliases: ['policymaker@vikshana.ai'] },
];

function signToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const updatedPayload = { ...payload, iat: now, exp: now + (8 * 60 * 60) };
    const body = Buffer.from(JSON.stringify(updatedPayload)).toString('base64url');
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch (e) {
        return null;
    }
}

class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body || {};

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Username and password are required.' });
            }

            const input = email.toLowerCase().trim();
            const user = USERS.find(u =>
                u.username.toLowerCase() === input ||
                u.id.toLowerCase() === input ||
                u.role.toLowerCase() === input ||
                (u.aliases && u.aliases.some(a => a.toLowerCase() === input))
            );

            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
            }

            if (user.password !== password) {
                return res.status(401).json({ success: false, message: 'Invalid credentials. Wrong password.' });
            }

            const tokenPayload = {
                id: user.id,
                email: user.username,
                role: user.role,
                department: user.department,
                name: user.name
            };
            const token = signToken(tokenPayload);

            return res.status(200).json({
                success: true,
                message: 'Authenticated successfully',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.username,
                    role: user.role,
                    department: user.department,
                    status: 'ACTIVE'
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async signup(req, res) {
        return res.status(400).json({ success: false, message: 'Signup is disabled for the hackathon demo.' });
    }

    static async googleAuth(req, res) {
        // Auto-login as admin for Google auth during hackathon
        const user = USERS[0];
        const token = signToken({ id: user.id, email: user.username, role: user.role, department: user.department, name: user.name });
        return res.status(200).json({
            success: true,
            message: 'Google Authentication successful',
            token,
            user: { id: user.id, name: user.name, email: user.username, role: user.role, department: user.department, status: 'ACTIVE' }
        });
    }

    static async forgotPassword(req, res) {
        return res.status(200).json({
            success: true,
            message: 'Hackathon demo credentials: admin/admin123, investigator/investigator123, analyst/analyst123, supervisor/supervisor123'
        });
    }

    static async getSession(req, res) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            const decoded = verifyToken(token);
            if (!decoded) {
                return res.status(401).json({ success: false, message: 'Invalid token' });
            }

            // Look up the user from our predefined list
            const user = USERS.find(u => u.id === decoded.id || u.username === decoded.email);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Session user not found' });
            }

            return res.status(200).json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.username,
                    role: user.role,
                    department: user.department,
                    status: 'ACTIVE'
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async logout(req, res) {
        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    }

    static async updateRole(req, res) {
        return res.status(400).json({ success: false, message: 'Role updates are disabled.' });
    }
}

module.exports = AuthController;
