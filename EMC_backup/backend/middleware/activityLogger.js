const db = require('../config/database');

/**
 * Middleware to log user activity
 * @param {string} action - The action being performed
 * @param {string} entityType - The type of entity being affected (e.g., 'claim', 'receipt')
 * @param {function} getEntityId - Optional function to extract entity ID from request
 */
const logActivity = (action, entityType, getEntityId) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        let responseBody;

        res.json = function (body) {
            responseBody = body;
            return originalJson.call(this, body);
        };

        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const userId = req.user ? req.user.id : null;
                    
                    // Priority: getEntityId from request > ID from response body
                    let entityId = getEntityId ? getEntityId(req) : null;
                    if (!entityId && responseBody) {
                        entityId = responseBody.id || (responseBody.claim ? responseBody.claim.id : null) || (responseBody.receipt ? responseBody.receipt.id : null);
                    }

                    const details = `${action} performed on ${entityType}`;
                    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

                    // If userId is 999 (Super Admin bypass), we still want to log it
                    // but we need to satisfy any DB constraints if they exist.
                    // Or we just check if it's 999 and log details without userId if needed.
                    
                    await db.query(
                        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [userId === 999 ? null : userId, action, entityType, entityId, details, ipAddress]
                    );
                } catch (err) {
                    // Silently fail logging to avoid breaking the main request
                    console.error('Audit Log Error:', err.message);
                }
            }
        });
        next();
    };
};

module.exports = logActivity;
