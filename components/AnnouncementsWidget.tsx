'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Announcement as AnnouncementIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  author: string;
}

interface AnnouncementsWidgetProps {
  maxItems?: number;
  showAll?: boolean;
  compact?: boolean;
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'urgent': return 'error';
    case 'high': return 'warning';
    case 'normal': return 'info';
    case 'low': return 'success';
    default: return 'info';
  }
};

export default function AnnouncementsWidget({
  maxItems = 5,
  showAll = false,
  compact = false
}: AnnouncementsWidgetProps) {
  const { user, token } = useAuth();
  const { t, i18n } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  const fetchAnnouncements = async () => {
    if (!token || !user) return;

    try {
      const response = await fetch('/api/dashboard/announcements', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // The dashboard API already filters announcements by role, so we can use them directly
        setAnnouncements(data.announcements || []);
      } else {
        setError(t('common.error', 'Error'));
      }
    } catch (error) {
      setError(t('common.error', 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'info';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    return priority === 'URGENT' ? <PriorityHighIcon /> : undefined;
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return t('common.today', 'Today');
    } else if (diffDays === 2) {
      return t('common.yesterday', 'Yesterday');
    } else if (diffDays <= 7) {
      return `${diffDays - 1} ${t('common.daysAgo', 'days ago')}`;
    } else {
      return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {t('common.loading', 'Loading...')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const displayAnnouncements = showAll ? announcements : announcements.slice(0, maxItems);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AnnouncementIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2">
            {t('announcements.announcements', 'Announcements')}
          </Typography>
        </Box>

        {displayAnnouncements.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {t('announcements.noAnnouncements', 'No announcements available')}
          </Typography>
        ) : (
          <List>
            {displayAnnouncements.map((announcement, index) => (
              <React.Fragment key={announcement.id}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    py: 2
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box flex={1}>
                      <Typography variant="subtitle2" component="h3" sx={{ mb: 0.5 }}>
                        {announcement.title}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip
                          label={t(`announcements.priority${announcement.priority}`, announcement.priority)}
                          color={getPriorityColor(announcement.priority)}
                          size="small"
                          icon={getPriorityIcon(announcement.priority)}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(announcement.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    {!compact && (
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(announcement.id)}
                      >
                        {expandedItems.has(announcement.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    )}
                  </Box>

                  <Collapse in={compact || expandedItems.has(announcement.id)}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {announcement.content}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        <Chip
                          label={t(`announcements.priority.${announcement.priority}`, announcement.priority)}
                          size="small"
                          variant="outlined"
                          color={getPriorityColor(announcement.priority.toUpperCase())}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('common.by', 'By')} {announcement.author}
                      </Typography>
                    </Box>
                  </Collapse>
                </ListItem>
                {index < displayAnnouncements.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {!showAll && announcements.length > maxItems && (
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              {t('common.andMore', 'And {{count}} more...', { count: announcements.length - maxItems })}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}