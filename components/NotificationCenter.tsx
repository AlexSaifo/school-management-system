'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  ButtonGroup,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Campaign as AnnouncementIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Quiz as ExamIcon,
  Schedule as TimetableIcon,
  Grade as GradeIcon,
  Warning as AttendanceIcon,
  Notifications as NotificationsIcon,
  ClearAll as ClearAllIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotifications } from '@/components/hooks/useNotifications';
import { type Notification, NotificationType, NotificationPriority } from '@/types/notifications';
import { useLanguage } from '@/contexts/LanguageContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const NotificationCenter: React.FC = () => {
  const theme = useTheme();
  const { language, direction } = useLanguage();
  const { notifications, unreadCount, loading, error, markAsRead, clearAll, refetch } = useNotifications();

  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const notificationTypes = [
    { value: 'ALL', label: language === 'ar' ? 'الكل' : 'All' },
    { value: NotificationType.ANNOUNCEMENT, label: language === 'ar' ? 'إعلانات' : 'Announcements' },
    { value: NotificationType.EVENT, label: language === 'ar' ? 'أحداث' : 'Events' },
    { value: NotificationType.ASSIGNMENT, label: language === 'ar' ? 'واجبات' : 'Assignments' },
    { value: NotificationType.EXAM, label: language === 'ar' ? 'امتحانات' : 'Exams' },
    { value: NotificationType.TIMETABLE_UPDATE, label: language === 'ar' ? 'تحديثات الجدول' : 'Timetable' },
    { value: NotificationType.GRADE_PUBLISHED, label: language === 'ar' ? 'الدرجات' : 'Grades' },
  ];

  const priorityLevels = [
    { value: 'ALL', label: language === 'ar' ? 'جميع الأولويات' : 'All Priorities' },
    { value: NotificationPriority.URGENT, label: language === 'ar' ? 'عاجل' : 'Urgent' },
    { value: NotificationPriority.HIGH, label: language === 'ar' ? 'عالي' : 'High' },
    { value: NotificationPriority.NORMAL, label: language === 'ar' ? 'عادي' : 'Normal' },
    { value: NotificationPriority.LOW, label: language === 'ar' ? 'منخفض' : 'Low' },
  ];

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by tab (read/unread)
    if (tabValue === 0) {
      // All notifications
    } else if (tabValue === 1) {
      // Unread only
      filtered = filtered.filter(n => !n.isRead);
    } else if (tabValue === 2) {
      // Read only
      filtered = filtered.filter(n => n.isRead);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(notification => {
        const title = language === 'ar' && notification.titleAr ? notification.titleAr : notification.title;
        const message = language === 'ar' && notification.messageAr ? notification.messageAr : notification.message;
        return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               message.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(notification => notification.priority === priorityFilter);
    }

    return filtered;
  }, [notifications, tabValue, searchTerm, typeFilter, priorityFilter, language]);

  const getNotificationIcon = (type: NotificationType) => {
    const iconProps = { fontSize: 'medium' as const };
    switch (type) {
      case NotificationType.ANNOUNCEMENT:
        return <AnnouncementIcon color="primary" {...iconProps} />;
      case NotificationType.EVENT:
        return <EventIcon color="secondary" {...iconProps} />;
      case NotificationType.ASSIGNMENT:
        return <AssignmentIcon color="info" {...iconProps} />;
      case NotificationType.EXAM:
        return <ExamIcon color="warning" {...iconProps} />;
      case NotificationType.TIMETABLE_UPDATE:
        return <TimetableIcon color="action" {...iconProps} />;
      case NotificationType.GRADE_PUBLISHED:
        return <GradeIcon color="success" {...iconProps} />;
      case NotificationType.ATTENDANCE_ALERT:
        return <AttendanceIcon color="error" {...iconProps} />;
      default:
        return <NotificationsIcon {...iconProps} />;
    }
  };

  const getPriorityChip = (priority: NotificationPriority) => {
    const colors = {
      [NotificationPriority.URGENT]: 'error',
      [NotificationPriority.HIGH]: 'warning',
      [NotificationPriority.NORMAL]: 'info',
      [NotificationPriority.LOW]: 'default',
    } as const;

    const labels = {
      [NotificationPriority.URGENT]: language === 'ar' ? 'عاجل' : 'Urgent',
      [NotificationPriority.HIGH]: language === 'ar' ? 'عالي' : 'High',
      [NotificationPriority.NORMAL]: language === 'ar' ? 'عادي' : 'Normal',
      [NotificationPriority.LOW]: language === 'ar' ? 'منخفض' : 'Low',
    };

    return (
      <Chip
        size="small"
        label={labels[priority]}
        color={colors[priority]}
        variant="outlined"
      />
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (language === 'ar') {
      return date.toLocaleDateString('ar-SA') + ' ' + date.toLocaleTimeString('ar-SA');
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = filteredNotifications.filter(n => !n.isRead);
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  return (
    <Box sx={{ direction }}>
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Box sx={{ p: 3, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              {language === 'ar' ? 'مركز الإشعارات' : 'Notification Center'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={refetch} title={language === 'ar' ? 'تحديث' : 'Refresh'}>
                <RefreshIcon />
              </IconButton>
              {unreadCount > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MarkReadIcon />}
                  onClick={handleMarkAllAsRead}
                >
                  {language === 'ar' ? 'تم قراءة الكل' : 'Mark All Read'}
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<ClearAllIcon />}
                onClick={clearAll}
                disabled={notifications.length === 0}
              >
                {language === 'ar' ? 'مسح الكل' : 'Clear All'}
              </Button>
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Card variant="outlined" sx={{ minWidth: 150 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography color="text.secondary" gutterBottom>
                  {language === 'ar' ? 'المجموع' : 'Total'}
                </Typography>
                <Typography variant="h4">
                  {notifications.length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 150 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography color="text.secondary" gutterBottom>
                  {language === 'ar' ? 'غير مقروءة' : 'Unread'}
                </Typography>
                <Typography variant="h4" color="error">
                  {unreadCount}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder={language === 'ar' ? 'البحث في الإشعارات...' : 'Search notifications...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            
            <TextField
              select
              size="small"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {notificationTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {priorityLevels.map((priority) => (
                <MenuItem key={priority.value} value={priority.value}>
                  {priority.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Tabs */}
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="notification tabs">
            <Tab 
              label={language === 'ar' ? `الكل (${notifications.length})` : `All (${notifications.length})`} 
            />
            <Tab 
              label={language === 'ar' ? `غير مقروءة (${unreadCount})` : `Unread (${unreadCount})`} 
            />
            <Tab 
              label={language === 'ar' ? `مقروءة (${notifications.length - unreadCount})` : `Read (${notifications.length - unreadCount})`} 
            />
          </Tabs>
        </Box>

        {/* Content */}
        <TabPanel value={tabValue} index={tabValue}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && filteredNotifications.length === 0 && (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications found'}
              </Typography>
              <Typography color="text.secondary">
                {searchTerm || typeFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? (language === 'ar' ? 'جرب تغيير المرشحات' : 'Try changing your filters')
                  : (language === 'ar' ? 'ستظهر الإشعارات الجديدة هنا' : 'New notifications will appear here')
                }
              </Typography>
            </Box>
          )}

          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.isRead 
                      ? 'transparent' 
                      : theme.palette.action.hover,
                    borderRadius: 1,
                    mb: 1,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ 
                            fontWeight: notification.isRead ? 'normal' : 'bold',
                            flex: 1,
                          }}
                        >
                          {language === 'ar' && notification.titleAr 
                            ? notification.titleAr 
                            : notification.title
                          }
                        </Typography>
                        {getPriorityChip(notification.priority)}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {language === 'ar' && notification.messageAr 
                            ? notification.messageAr 
                            : notification.message
                          }
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(notification.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {language === 'ar' ? 'بواسطة' : 'by'} {notification.createdBy.name}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    {!notification.isRead && (
                      <IconButton
                        edge="end"
                        onClick={() => markAsRead(notification.id)}
                        title={language === 'ar' ? 'تم القراءة' : 'Mark as read'}
                      >
                        <MarkReadIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </TabPanel>
      </Paper>
    </Box>
  );
};