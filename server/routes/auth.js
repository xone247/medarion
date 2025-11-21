/**
 * Updated Authentication Routes with Account Tiers and User Types
 * Replaces server/routes/auth.js
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper: Map frontend user_type to backend role
function mapUserTypeToRole(userType) {
  const mapping = {
    'investors_finance': 'investor',
    'startup': 'startup',
    'industry_executives': 'regulator',
    'health_science_experts': 'researcher',
    'media_advisors': 'regulator'
  };
  return mapping[userType] || 'startup';
}

// Helper: Get default modules for user type and tier
function getDefaultModules(userType, accountTier) {
  const DEFAULT_BY_ROLE = {
    investors_finance: {
      free: ['dashboard', 'nation_pulse', 'companies'],
      paid: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      academic: ['dashboard', 'dealflow_tracker', 'companies', 'regulatory', 'clinical_trials', 'nation_pulse'],
      enterprise: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse', 'ai_tools']
    },
    startup: {
      free: ['dashboard', 'nation_pulse', 'investor_search'],
      paid: ['dashboard', 'my_profile', 'analytics', 'fundraising_crm', 'investor_search', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'regulatory', 'clinical_trials', 'nation_pulse'],
      academic: ['dashboard', 'my_profile', 'fundraising_crm', 'investor_search', 'dealflow_tracker', 'regulatory', 'clinical_trials', 'nation_pulse'],
      enterprise: ['dashboard', 'my_profile', 'analytics', 'fundraising_crm', 'investor_search', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'regulatory', 'clinical_trials', 'nation_pulse', 'ai_tools']
    },
    industry_executives: {
      free: ['dashboard', 'nation_pulse', 'companies'],
      paid: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      academic: ['dashboard', 'dealflow_tracker', 'companies', 'regulatory', 'clinical_trials', 'nation_pulse'],
      enterprise: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse', 'ai_tools']
    },
    health_science_experts: {
      free: ['dashboard', 'nation_pulse', 'clinical_trials'],
      paid: ['dashboard', 'grant_funding_tracker', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      academic: ['dashboard', 'grant_funding_tracker', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      enterprise: ['dashboard', 'grant_funding_tracker', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse', 'ai_tools']
    },
    media_advisors: {
      free: ['dashboard', 'nation_pulse', 'dealflow_tracker'],
      paid: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      academic: ['dashboard', 'dealflow_tracker', 'companies', 'regulatory', 'clinical_trials', 'nation_pulse'],
      enterprise: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse', 'ai_tools']
    }
  };

  return DEFAULT_BY_ROLE[userType]?.[accountTier] || DEFAULT_BY_ROLE.startup.free;
}

// Register new user
router.post('/signup', async (req, res) => {
  try {
    const { 
      username, email, password, firstName, lastName, 
      role, userType, companyName, phone, country, city,
      accountTier 
    } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Determine user_type and account_tier
    const finalUserType = userType || 'startup';
    const finalAccountTier = accountTier || 'free';
    const finalRole = mapUserTypeToRole(finalUserType);

    // Get default modules based on user type and tier
    const defaultModules = getDefaultModules(finalUserType, finalAccountTier);

    // Create user
    // Split fullName if firstName/lastName not provided
    let finalFirstName = firstName || '';
    let finalLastName = lastName || '';
    if (!finalFirstName && !finalLastName) {
      // Try to parse fullName if provided
      const fullName = req.body.fullName || '';
      if (fullName) {
        const nameParts = fullName.trim().split(/\s+/);
        finalFirstName = nameParts[0] || '';
        finalLastName = nameParts.slice(1).join(' ') || '';
      }
    }
    
    // Ensure username is set (use email prefix if not provided)
    const finalUsername = username || email.split('@')[0];
    
    const [result] = await pool.execute(
      `INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, user_type, account_tier, company_name, phone, country, city,
        dashboard_modules, ai_quota_used, ai_quota_reset_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalUsername, email, passwordHash, finalFirstName || null, finalLastName || null,
        finalRole, finalUserType, finalAccountTier, companyName || null, phone || null, country || null, city || null,
        JSON.stringify(defaultModules), 0, new Date().toISOString().split('T')[0]
      ]
    );

    const userId = result.insertId;

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId, 
        username, 
        email, 
        role: finalRole,
        user_type: finalUserType,
        account_tier: finalAccountTier
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      session_token: token,
      user: {
        id: userId,
        username,
        email,
        firstName,
        lastName,
        full_name: `${firstName} ${lastName}`,
        role: finalRole,
        user_type: finalUserType,
        account_tier: finalAccountTier,
        companyName,
        company_name: companyName,
        dashboard_modules: defaultModules,
        is_admin: false,
        app_roles: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user - support both /auth and /auth/signin
const handleSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Parse JSON fields
    const appRoles = user.app_roles ? JSON.parse(user.app_roles) : [];
    const dashboardModules = user.dashboard_modules ? JSON.parse(user.dashboard_modules) : [];
    const moduleOrder = user.module_order ? JSON.parse(user.module_order) : [];

    // Check if user is admin
    const isAdmin = appRoles.includes('super_admin') || user.role === 'admin';

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        user_type: user.user_type,
        account_tier: user.account_tier,
        is_admin: isAdmin
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data in format expected by frontend (supports both camelCase and snake_case)
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      session_token: token, // Support both formats for compatibility
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        role: user.role,
        user_type: user.user_type,
        account_tier: user.account_tier || 'free',
        companyName: user.company_name,
        company_name: user.company_name,
        phone: user.phone,
        country: user.country,
        city: user.city,
        bio: user.bio,
        profileImage: user.profile_image,
        profile_image: user.profile_image,
        isVerified: user.is_verified,
        is_verified: user.is_verified,
        is_admin: isAdmin,
        app_roles: appRoles,
        dashboard_modules: dashboardModules,
        module_order: moduleOrder,
        ai_quota_used: user.ai_quota_used || 0,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Register both /auth and /auth/signin routes
router.post('/signin', handleSignin);
router.post('/', handleSignin); // Also handle POST /api/auth directly

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, username, email, first_name, last_name, role, user_type, 
              account_tier, company_name, phone, country, city, bio, profile_image, 
              is_verified, app_roles, dashboard_modules, module_order, ai_quota_used,
              created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const appRoles = user.app_roles ? JSON.parse(user.app_roles) : [];
    const dashboardModules = user.dashboard_modules ? JSON.parse(user.dashboard_modules) : [];
    const moduleOrder = user.module_order ? JSON.parse(user.module_order) : [];
    const isAdmin = appRoles.includes('super_admin') || user.role === 'admin';

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        user_type: user.user_type,
        account_tier: user.account_tier,
        companyName: user.company_name,
        phone: user.phone,
        country: user.country,
        city: user.city,
        bio: user.bio,
        profileImage: user.profile_image,
        isVerified: user.is_verified,
        is_admin: isAdmin,
        app_roles: appRoles,
        dashboard_modules: dashboardModules,
        module_order: moduleOrder,
        ai_quota_used: user.ai_quota_used || 0,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { 
      firstName, lastName, companyName, phone, country, city, bio,
      dashboard_modules, module_order 
    } = req.body;

    const updates = [];
    const values = [];

    if (firstName !== undefined) { updates.push('first_name = ?'); values.push(firstName); }
    if (lastName !== undefined) { updates.push('last_name = ?'); values.push(lastName); }
    if (companyName !== undefined) { updates.push('company_name = ?'); values.push(companyName); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (country !== undefined) { updates.push('country = ?'); values.push(country); }
    if (city !== undefined) { updates.push('city = ?'); values.push(city); }
    if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }
    if (dashboard_modules !== undefined) { updates.push('dashboard_modules = ?'); values.push(JSON.stringify(dashboard_modules)); }
    if (module_order !== undefined) { updates.push('module_order = ?'); values.push(JSON.stringify(module_order)); }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    if (updates.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update account tier (admin only)
router.put('/admin/user/:userId/tier', authenticateToken, async (req, res) => {
  try {
    // Check if requester is admin
    const isAdmin = req.user.is_admin === true || req.user.is_admin === 1 || req.user.role === 'admin' || (Array.isArray(req.user.app_roles) && req.user.app_roles.includes('super_admin'));
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const { userId } = req.params;
    const { account_tier } = req.body;

    if (!['free', 'paid', 'academic', 'enterprise'].includes(account_tier)) {
      return res.status(400).json({ error: 'Invalid account tier' });
    }

    await pool.execute(
      'UPDATE users SET account_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [account_tier, userId]
    );

    res.json({ message: 'Account tier updated successfully' });
  } catch (error) {
    console.error('Tier update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update app roles (admin only)
router.put('/admin/user/:userId/roles', authenticateToken, async (req, res) => {
  try {
    // Check if requester is admin
    const isAdmin = req.user.is_admin === true || req.user.is_admin === 1 || req.user.role === 'admin' || (Array.isArray(req.user.app_roles) && req.user.app_roles.includes('super_admin'));
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const { userId } = req.params;
    const { app_roles } = req.body;

    if (!Array.isArray(app_roles)) {
      return res.status(400).json({ error: 'app_roles must be an array' });
    }

    const validRoles = ['super_admin', 'blog_admin', 'content_editor', 'ads_admin'];
    const invalid = app_roles.filter(r => !validRoles.includes(r));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Invalid roles: ${invalid.join(', ')}` });
    }

    await pool.execute(
      'UPDATE users SET app_roles = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(app_roles), userId]
    );

    res.json({ message: 'App roles updated successfully' });
  } catch (error) {
    console.error('Roles update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track AI usage
router.post('/ai/usage', authenticateToken, async (req, res) => {
  try {
    const { query_type, tokens_used, query_text } = req.body;

    // Log AI usage
    await pool.execute(
      'INSERT INTO ai_usage_log (user_id, query_type, tokens_used, query_text) VALUES (?, ?, ?, ?)',
      [req.user.id, query_type, tokens_used || 1, query_text || '']
    );

    // Increment user's AI quota used
    await pool.execute(
      'UPDATE users SET ai_quota_used = ai_quota_used + 1 WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'AI usage recorded' });
  } catch (error) {
    console.error('AI usage tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Forgot Password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, email, username FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    // Always return success (security: don't reveal if email exists)
    // In production, send email with reset token
    // For now, generate a reset token and store it (or use JWT with short expiry)
    if (users.length > 0) {
      const user = users[0];
      
      // Generate reset token (JWT with short expiry - 1 hour)
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Store reset token in database (you may want to create a password_resets table)
      // For now, we'll just return success
      // In production: Send email with reset link containing the token
      
      console.log(`Password reset requested for ${email}. Token: ${resetToken.substring(0, 20)}...`);
      // TODO: Send email with reset link: /reset-password?token=${resetToken}
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Reset Password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({ success: false, error: 'Invalid reset token' });
      }
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user password
    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, decoded.userId]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Change Password - Change password for authenticated user
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Get current user
    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

