import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Test database connection on route load
db.execute('SELECT 1').then(() => {
  console.log('✅ Notifications route: Database connection verified');
}).catch((error) => {
  console.error('❌ Notifications route: Database connection failed:', error);
});

// Get all notifications for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('[Notifications] Fetching for user:', req.user.id);
    
    // Ensure notifications table exists
    try {
      await db.execute('SELECT 1 FROM notifications LIMIT 1');
    } catch (tableError) {
      // Table doesn't exist, create it
      await db.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type ENUM('info', 'success', 'warning', 'error', 'system') DEFAULT 'info',
          category VARCHAR(50) DEFAULT 'system',
          is_read TINYINT(1) DEFAULT 0,
          is_important TINYINT(1) DEFAULT 0,
          action_url VARCHAR(500) NULL,
          action_text VARCHAR(100) NULL,
          metadata TEXT NULL,
          expires_at DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_is_read (is_read),
          INDEX idx_created_at (created_at),
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
    
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Check if notifications table exists, if not return empty array
    let query = `
      SELECT n.*, 
             CASE WHEN n.expires_at IS NULL OR n.expires_at > NOW() THEN 1 ELSE 0 END as is_active
      FROM notifications n 
      WHERE n.user_id = ? 
    `;
    
    const queryParams = [req.user.id];
    
    if (unread_only === 'true' || unread_only === true) {
      query += ' AND n.is_read = FALSE';
    }
    
    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [notifications] = await db.execute(query, queryParams);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    const countParams = [req.user.id];
    
    if (unread_only === 'true' || unread_only === true) {
      countQuery += ' AND is_read = FALSE';
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    console.log('[Notifications] Found', notifications.length, 'notifications for user', req.user.id);
    
    res.json({
      success: true,
      notifications: notifications || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Notifications] Error fetching notifications:', error);
    // If table doesn't exist, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('[Notifications] notifications table does not exist, returning empty array');
      res.json({
        success: true,
        notifications: [],
        pagination: {
          page: parseInt(req.query.page || 1),
          limit: parseInt(req.query.limit || 20),
          total: 0,
          pages: 0
        }
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    console.log('[Notifications] Fetching unread count for user:', req.user.id);
    
    // Check if notifications table exists
    try {
      const [result] = await db.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE AND (expires_at IS NULL OR expires_at > NOW())',
        [req.user.id]
      );
      
      const count = result[0]?.count || 0;
      console.log('[Notifications] Unread count for user', req.user.id, ':', count);
      
      res.json({
        success: true,
        count: parseInt(count),
        unread_count: parseInt(count) // Support both formats
      });
    } catch (tableError) {
      // If table doesn't exist, return 0
      if (tableError.code === 'ER_NO_SUCH_TABLE') {
        console.log('[Notifications] notifications table does not exist, returning 0');
        res.json({
          success: true,
          count: 0,
          unread_count: 0
        });
      } else {
        throw tableError;
      }
    }
  } catch (error) {
    console.error('[Notifications] Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count', error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// Also support PATCH /:id with body for marking as read (for compatibility)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;
    
    // If is_read is being set, use the read endpoint logic
    if (is_read !== undefined) {
      const [result] = await db.execute(
        'UPDATE notifications SET is_read = ? WHERE id = ? AND user_id = ?',
        [is_read ? 1 : 0, id, req.user.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      
      return res.json({ success: true, message: 'Notification updated' });
    }
    
    // Otherwise, use the general update logic
    const updates = req.body;
    const allowedUpdates = ['is_read', 'is_important', 'title', 'message'];
    const filteredUpdates = {};
    
    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }
    
    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid updates provided' });
    }
    
    const [result] = await db.execute(
      `UPDATE notifications SET ${Object.keys(filteredUpdates).map(key => `${key} = ?`).join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      [...Object.values(filteredUpdates), id, req.user.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification updated' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// Create notification (admin/system use)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Ensure notifications table exists
    try {
      await db.execute('SELECT 1 FROM notifications LIMIT 1');
    } catch (tableError) {
      // Table doesn't exist, create it
      await db.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type ENUM('info', 'success', 'warning', 'error', 'system') DEFAULT 'info',
          category VARCHAR(50) DEFAULT 'system',
          is_read TINYINT(1) DEFAULT 0,
          is_important TINYINT(1) DEFAULT 0,
          action_url VARCHAR(500) NULL,
          action_text VARCHAR(100) NULL,
          metadata TEXT NULL,
          expires_at DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_is_read (is_read),
          INDEX idx_created_at (created_at),
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
    
    const {
      user_id,
      title,
      message,
      type = 'info',
      category = 'system',
      is_important = false,
      action_url = null,
      action_text = null,
      metadata = null,
      expires_at = null
    } = req.body;
    
    // Check if user has permission to create notifications (admin or system)
    const isAdmin = req.user.is_admin === true || req.user.is_admin === 1 || req.user.role === 'admin' || (Array.isArray(req.user.app_roles) && req.user.app_roles.includes('super_admin'));
    
    if (!isAdmin && user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO notifications 
       (user_id, title, message, type, category, is_important, action_url, action_text, metadata, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, title, message, type, category, is_important, action_url, action_text, 
       metadata ? JSON.stringify(metadata) : null, expires_at]
    );
    
    res.status(201).json({
      success: true,
      message: 'Notification created',
      notification: {
        id: result.insertId,
        user_id,
        title,
        message,
        type,
        category,
        is_important,
        action_url,
        action_text,
        metadata,
        expires_at
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
});

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const [result] = await db.execute(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [req.user.id]
    );
    
    if (result.length === 0) {
      // Create default preferences
      await db.execute(
        `INSERT INTO notification_preferences 
         (user_id, email_notifications, push_notifications, in_app_notifications, notification_types) 
         VALUES (?, TRUE, TRUE, TRUE, ?)`,
        [req.user.id, JSON.stringify({
          info: true,
          success: true,
          warning: true,
          error: true,
          system: true
        })]
      );
      
      const [newResult] = await db.execute(
        'SELECT * FROM notification_preferences WHERE user_id = ?',
        [req.user.id]
      );
      
      return res.json({
        success: true,
        preferences: {
          ...newResult[0],
          notification_types: JSON.parse(newResult[0].notification_types)
        }
      });
    }
    
    res.json({
      success: true,
      preferences: {
        ...result[0],
        notification_types: JSON.parse(result[0].notification_types)
      }
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
  }
});

// Update notification preferences
router.patch('/preferences', authenticateToken, async (req, res) => {
  try {
    const {
      email_notifications,
      push_notifications,
      in_app_notifications,
      notification_types
    } = req.body;
    
    await db.execute(
      `UPDATE notification_preferences 
       SET email_notifications = ?, push_notifications = ?, in_app_notifications = ?, notification_types = ?
       WHERE user_id = ?`,
      [
        email_notifications,
        push_notifications,
        in_app_notifications,
        JSON.stringify(notification_types),
        req.user.id
      ]
    );
    
    res.json({ success: true, message: 'Preferences updated' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

export default router;
