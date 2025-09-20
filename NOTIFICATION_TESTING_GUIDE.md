# Testing Your Notification System 🔔

## 📋 Quick Testing Guide

Your notification system is now fully implemented! Here's how to see and test notifications:

### 1. **Check the Notification Bell** (In Navbar)
- Look for the **bell icon** (🔔) in your navbar (top-right area)
- The bell should show a **red badge with number** when you have unread notifications
- **Click the bell** to see a dropdown with your notifications

### 2. **Test Notifications Using Browser Console**

#### **Method A: Manual Test Notification**
Open browser console (F12) and run:
```javascript
// Simulate a test notification
if (window.socket && window.socket.connected) {
  const testNotification = {
    id: `test_${Date.now()}`,
    type: 'ANNOUNCEMENT',
    title: 'Test Notification',
    titleAr: 'إشعار تجريبي',
    message: 'This is a test notification. If you see this, the system works!',
    messageAr: 'هذا إشعار تجريبي. إذا كنت ترى هذا، فالنظام يعمل!',
    priority: 'NORMAL',
    targetRole: 'ALL',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    isRead: false,
    metadata: { test: true }
  };
  
  // Emit to yourself
  window.socket.emit('test_notification', testNotification);
  console.log('📤 Sent test notification:', testNotification);
} else {
  console.warn('❌ Socket not connected');
}
```

#### **Method B: Check Socket Connection**
```javascript
// Check socket status
console.log('Socket connected:', window.socket?.connected);
console.log('Socket rooms:', window.socket?.rooms);

// Listen for notifications manually
if (window.socket) {
  window.socket.on('notification', (notification) => {
    console.log('🔔 Received notification:', notification);
  });
}
```

### 3. **Create Real Notifications**

#### **Through Announcements**
1. Go to `/announcements` page
2. Create a new announcement
3. A notification should be sent to targeted users
4. Check the notification bell

#### **Through Events**  
1. Go to `/events` page
2. Create a new event
3. Check notification bell for event notification

#### **Through Assignments**
1. Go to `/assignments` page  
2. Create an assignment
3. Students should receive notifications

### 4. **Debug Information**

#### **Check Console Logs**
The system logs detailed information:
- `🔌 Socket connected` - Connection established
- `👤 Joined room` - User joined appropriate room based on role
- `🔔 Received notification` - New notification received
- `📊 Notifications updated` - State updated in component

#### **Check Network Tab**
- Look for `socket.io` connections
- Verify WebSocket is established
- Check for notification payloads

### 5. **Troubleshooting**

#### **If Bell Icon Not Visible:**
- Check if user is logged in (notifications only for authenticated users)
- Verify `Navbar` component is rendered
- Check browser console for errors

#### **If No Notifications Appear:**
- Verify socket connection: `window.socket?.connected`
- Check user role and room membership
- Look for console logs during notification events
- Try creating an announcement/event to trigger notification

#### **If Badge Count Wrong:**
- Check `unreadCount` in browser console
- Verify `isRead` status of notifications
- Clear and refresh notifications

### 6. **Expected User Experience**

✅ **When everything works:**
1. **Bell shows badge** with unread count (red number)
2. **Click bell** → dropdown opens with notifications list
3. **Notifications show:**
   - Icon based on type (📢 announcement, 📅 event, etc.)
   - Title and message (bilingual support)
   - Time ago (e.g., "5m ago", "2h ago")  
   - Priority color bar (left border)
4. **Click notification** → marks as read, badge count decreases
5. **Real-time updates** when new notifications arrive

### 7. **Role-Based Testing**

Test with different user roles:
- **Students**: Receive assignment, exam, timetable notifications
- **Teachers**: Receive event, announcement notifications  
- **Parents**: Receive student-related notifications
- **Admins**: Receive all system notifications

### 8. **Bilingual Testing**

Switch between English/Arabic to verify:
- Notification titles and messages display correctly
- Time formatting shows in correct language
- UI elements translate properly

---

## 🚀 Next Steps

If notifications aren't visible:
1. Check browser console for errors/logs
2. Verify socket connection status
3. Try creating a test announcement
4. Check network tab for WebSocket activity

If you need help debugging, share:
- Browser console logs
- Current user role  
- Steps you tried
- What you expected vs. what happened

The system is comprehensive and should work perfectly! 🎉