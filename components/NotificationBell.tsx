'use client';

import React, { useState, useRef } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Campaign as AnnouncementIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Quiz as ExamIcon,
  Schedule as TimetableIcon,
  Grade as GradeIcon,
  Warning as AttendanceIcon,
  Chat as ChatIcon,
  MarkEmailRead as MarkReadIcon,
  ClearAll as ClearAllIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotifications } from '@/components/hooks/useNotifications';
import { type Notification, NotificationType, NotificationPriority } from '@/types/notifications';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationBellProps {
  maxDisplayedNotifications?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  maxDisplayedNotifications = 10 
}) => {
  const theme = useTheme();
  const { language, direction } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Add error boundary for the notifications hook
  let notifications: any[] = [];
  let unreadCount = 0;
  let loading = false;
  let error: string | null = null;
  let markAsRead = async (id: string) => {};
  let clearAll = () => {};
  let refetch = async () => {};

  try {
    const notificationsHook = useNotifications();
    notifications = notificationsHook.notifications;
    unreadCount = notificationsHook.unreadCount;
    loading = notificationsHook.loading;
    error = notificationsHook.error;
    markAsRead = notificationsHook.markAsRead;
    clearAll = notificationsHook.clearAll;
    refetch = notificationsHook.refetch;
  } catch (hookError) {
    console.error('❌ Error in useNotifications hook:', hookError);
    error = 'Failed to load notifications';
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    try {
      setAnchorEl(event.currentTarget);
    } catch (err) {
      console.error('❌ Error setting anchorEl:', err);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleClearAll = () => {
    clearAll();
    handleClose();
  };

  const handleRefresh = () => {
    refetch();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ANNOUNCEMENT:
        return <AnnouncementIcon color="primary" />;
      case NotificationType.EVENT:
        return <EventIcon color="secondary" />;
      case NotificationType.ASSIGNMENT:
        return <AssignmentIcon color="info" />;
      case NotificationType.EXAM:
        return <ExamIcon color="warning" />;
      case NotificationType.TIMETABLE_UPDATE:
        return <TimetableIcon color="action" />;
      case NotificationType.GRADE_PUBLISHED:
        return <GradeIcon color="success" />;
      case NotificationType.ATTENDANCE_ALERT:
        return <AttendanceIcon color="error" />;
      case NotificationType.CHAT_MESSAGE:
        return <ChatIcon color="primary" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return theme.palette.error.main;
      case NotificationPriority.HIGH:
        return theme.palette.warning.main;
      case NotificationPriority.NORMAL:
        return theme.palette.info.main;
      case NotificationPriority.LOW:
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return language === 'ar' ? `منذ ${days} أيام` : `${days}d ago`;
    } else if (hours > 0) {
      return language === 'ar' ? `منذ ${hours} ساعات` : `${hours}h ago`;
    } else if (minutes > 0) {
      return language === 'ar' ? `منذ ${minutes} دقائق` : `${minutes}m ago`;
    } else {
      return language === 'ar' ? 'الآن' : 'now';
    }
  };

  const displayedNotifications = notifications.slice(0, maxDisplayedNotifications);
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={language === 'ar' ? 'الإشعارات' : 'Notifications'}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-label="notifications"
          sx={{ 
            mr: 1,
            position: 'relative',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
          data-testid="notification-bell"
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                right: -3,
                top: -3,
                border: `2px solid ${theme.palette.background.paper}`,
                padding: '0 4px',
                fontSize: '0.75rem',
                minWidth: '16px',
                height: '16px'
              }
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsIcon sx={{ fontSize: '1.5rem' }} />
            ) : (
              <NotificationsNoneIcon sx={{ fontSize: '1.5rem' }} />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 8,
          sx: {
            width: 400,
            maxWidth: '90vw',
            maxHeight: 500,
            mt: 1.5,
            direction: direction,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'white',
            '& .MuiMenuItem-root': {
              padding: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        MenuListProps={{
          sx: { py: 0 }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1, backgroundColor: theme.palette.background.default }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {language === 'ar' ? 'الإشعارات' : 'Notifications'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {unreadCount > 0 && (
                <Chip 
                  size="small" 
                  label={unreadCount} 
                  color="error" 
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              <IconButton
                size="small"
                onClick={handleRefresh}
                title={language === 'ar' ? 'تحديث' : 'Refresh'}
                disabled={loading}
              >
                {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
              <IconButton
                size="small"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                title={language === 'ar' ? 'مسح الكل' : 'Clear all'}
              >
                <ClearAllIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Content */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
              <Button size="small" onClick={handleRefresh} sx={{ mt: 1 }}>
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </Alert>
          )}

          {!loading && !error && notifications.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsNoneIcon 
                color="disabled" 
                sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} 
              />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {language === 'ar' 
                  ? 'ستظهر الإشعارات الجديدة هنا' 
                  : 'New notifications will appear here'
                }
              </Typography>
            </Box>
          )}

          {!loading && !error && displayedNotifications.length > 0 && (
            <List sx={{ p: 0 }}>
              {displayedNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.isRead 
                        ? 'transparent' 
                        : theme.palette.action.hover,
                      cursor: 'pointer',
                      py: 2,
                      px: 2,
                      borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
                      '&:hover': {
                        backgroundColor: theme.palette.action.selected,
                      },
                    }}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ 
                              fontWeight: notification.isRead ? 'normal' : 'bold',
                              fontSize: '0.9rem',
                              lineHeight: 1.2,
                              pr: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {language === 'ar' && notification.titleAr 
                              ? notification.titleAr 
                              : notification.title
                            }
                          </Typography>
                          {!notification.isRead && (
                            <Box 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                backgroundColor: theme.palette.primary.main,
                                flexShrink: 0,
                                mt: 0.5
                              }} 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              fontSize: '0.8rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 0.5,
                              lineHeight: 1.3,
                            }}
                          >
                            {language === 'ar' && notification.messageAr 
                              ? notification.messageAr 
                              : notification.message
                            }
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(notification.createdAt)}
                            </Typography>
                            
                            <Chip
                              size="small"
                              label={notification.type.replace('_', ' ')}
                              sx={{ 
                                fontSize: '0.7rem',
                                height: 20,
                                backgroundColor: theme.palette.grey[100],
                                color: theme.palette.text.secondary,
                              }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {index < displayedNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {notifications.length > maxDisplayedNotifications && (
            <Box sx={{ p: 2, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  handleClose();
                  window.location.href = '/dashboard/notifications';
                }}
                sx={{ fontSize: '0.8rem' }}
              >
                {language === 'ar' 
                  ? `عرض جميع الإشعارات (${notifications.length})` 
                  : `View all notifications (${notifications.length})`
                }
              </Button>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};