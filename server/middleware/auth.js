import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

export const authenticateToken = async (req, res, next) => {
  // Check both 'authorization' and 'Authorization' headers (case-insensitive)
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('[Auth] No token provided for:', req.method, req.path);
    return res.status(401).json({ error: 'Access token required' });
  }

  // Development bypass for test-token (also allow if NODE_ENV is not set, assuming development)
  if ((!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && token === 'test-token') {
    // Try to get real admin user from database for test-token
    try {
      const [users] = await pool.execute(
        `SELECT id, username, email, role, user_type, account_tier, is_active, 
                app_roles, is_admin, dashboard_modules, module_order
         FROM users WHERE email = 'superadmin@medarion.com' AND is_active = 1 LIMIT 1`
      );
      
      if (users.length > 0) {
        const user = users[0];
        const appRoles = user.app_roles ? (typeof user.app_roles === 'string' ? JSON.parse(user.app_roles) : user.app_roles) : [];
        const isAdmin = appRoles.includes('super_admin') || user.role === 'admin' || user.is_admin === 1;
        
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          user_type: user.user_type,
          account_tier: user.account_tier || 'free',
          is_active: user.is_active,
          is_admin: isAdmin,
          app_roles: appRoles,
          dashboard_modules: user.dashboard_modules ? (typeof user.dashboard_modules === 'string' ? JSON.parse(user.dashboard_modules) : user.dashboard_modules) : [],
          module_order: user.module_order ? (typeof user.module_order === 'string' ? JSON.parse(user.module_order) : user.module_order) : []
        };
        return next();
      }
    } catch (dbError) {
      console.warn('Could not fetch user for test-token, using mock:', dbError.message);
    }
    
    // Fallback to mock user if database query fails or no user found
    req.user = {
      id: 1,
      username: 'admin',
      email: 'superadmin@medarion.com',
      role: 'admin',
      user_type: 'industry_executives',
      account_tier: 'enterprise',
      is_active: 1,
      is_admin: true,
      app_roles: ['super_admin'],
      dashboard_modules: [],
      module_order: []
    };
    return next();
  }

  try {
    // Log token info for debugging (first 20 chars only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Verifying token:', token.substring(0, 20) + '...', 'for path:', req.path);
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (verifyError) {
      console.error('[Auth] JWT verification error:', verifyError.name, verifyError.message);
      if (verifyError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', details: 'Please log in again' });
      }
      if (verifyError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token format', details: verifyError.message });
      }
      throw verifyError;
    }
    
    // Check for userId in various possible fields
    const userId = decoded.userId || decoded.id || decoded.user_id;
    if (!userId) {
      console.error('[Auth] Token decoded but missing userId. Decoded:', JSON.stringify(decoded, null, 2));
      return res.status(401).json({ error: 'Invalid token - missing user ID' });
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Token verified, userId:', userId);
    }
    
    // Verify user still exists and is active - fetch all permission-related fields
    const [users] = await pool.execute(
      `SELECT id, username, email, role, user_type, account_tier, is_active, 
              app_roles, is_admin, dashboard_modules, module_order
       FROM users WHERE id = ? AND is_active = 1`,
      [userId]
    );

    if (users.length === 0) {
      console.error('[Auth] User not found or inactive. userId:', userId, 'is_active check failed');
      // Check if user exists but is inactive
      const [inactiveUsers] = await pool.execute('SELECT id, is_active FROM users WHERE id = ?', [userId]);
      if (inactiveUsers.length > 0) {
        console.error('[Auth] User exists but is inactive. is_active:', inactiveUsers[0].is_active);
        return res.status(401).json({ error: 'Account is inactive' });
      }
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    const user = users[0];
    
    // Parse JSON fields and set is_admin flag
    let appRoles = [];
    try {
      appRoles = user.app_roles ? (typeof user.app_roles === 'string' ? JSON.parse(user.app_roles) : user.app_roles) : [];
    } catch (parseError) {
      console.warn('Error parsing app_roles:', parseError);
      appRoles = [];
    }
    
    const isAdmin = appRoles.includes('super_admin') || user.role === 'admin' || user.is_admin === 1;
    
    // Parse dashboard_modules and module_order
    let dashboardModules = [];
    let moduleOrder = [];
    try {
      dashboardModules = user.dashboard_modules ? (typeof user.dashboard_modules === 'string' ? JSON.parse(user.dashboard_modules) : user.dashboard_modules) : [];
    } catch (parseError) {
      console.warn('Error parsing dashboard_modules:', parseError);
    }
    try {
      moduleOrder = user.module_order ? (typeof user.module_order === 'string' ? JSON.parse(user.module_order) : user.module_order) : [];
    } catch (parseError) {
      console.warn('Error parsing module_order:', parseError);
    }
    
    // Set req.user with all permission fields
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      user_type: user.user_type,
      account_tier: user.account_tier || 'free',
      is_active: user.is_active,
      is_admin: isAdmin,
      app_roles: appRoles,
      dashboard_modules: dashboardModules,
      module_order: moduleOrder
    };
    
    next();
  } catch (error) {
    // More specific error messages
    console.error('[Auth] Token verification failed:', error.name, error.message);
    console.error('[Auth] Token (first 50 chars):', token.substring(0, 50));
    console.error('[Auth] JWT_SECRET set:', !!JWT_SECRET, 'Length:', JWT_SECRET?.length);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token format', details: error.message });
    }
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Token not active yet' });
    }
    return res.status(401).json({ error: 'Invalid or expired token', details: error.message });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
