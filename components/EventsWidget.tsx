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
  Button,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  location: string | null;
  type: string;
  typeColor: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  createdAt: string;
  author: string;
}

interface EventsWidgetProps {
  maxItems?: number;
  showAll?: boolean;
  compact?: boolean;
}

const getEventTypeLabel = (type: string, t: any) => {
  const eventTypes: { [key: string]: string } = {
    'ACADEMIC': t('events.types.academic', 'Academic'),
    'SPORTS': t('events.types.sports', 'Sports'),
    'CULTURAL': t('events.types.cultural', 'Cultural'),
    'MEETING': t('events.types.meeting', 'Meeting'),
    'HOLIDAY': t('events.types.holiday', 'Holiday'),
    'EXAM': t('events.types.exam', 'Exam'),
    'GENERAL': t('events.types.general', 'General'),
  };
  return eventTypes[type.toUpperCase()] || t('events.types.general', 'General');
};

export default function EventsWidget({
  maxItems = 5,
  showAll = false,
  compact = false
}: EventsWidgetProps) {
  const { user, token } = useAuth();
  const { t, i18n } = useTranslation();
  const { direction, isRTL } = useLanguage();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    if (!token || !user) return;

    try {
      const response = await fetch('/api/dashboard/events', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        setError(t('common.error', 'Error'));
      }
    } catch (error) {
      setError(t('common.error', 'Error'));
    } finally {
      setLoading(false);
    }
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
      // Use Hijri format for Arabic, Gregorian for English
      if (i18n.language === 'ar') {
        return formatHijriDate(date);
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
  };

  const formatEventDate = (dateString: string, timeString: string | null) => {
    const date = new Date(dateString);
    const formattedDate = i18n.language === 'ar'
      ? formatHijriDate(date)
      : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

    if (timeString) {
      return `${formattedDate} ${t('common.at', 'at')} ${timeString}`;
    }
    return formattedDate;
  };

  // Simple Hijri date conversion (approximate)
  const formatHijriDate = (gregorianDate: Date) => {
    // This is a simplified conversion - for production, consider using a proper Hijri library
    const gregorianYear = gregorianDate.getFullYear();
    const gregorianMonth = gregorianDate.getMonth() + 1; // getMonth() returns 0-11
    const gregorianDay = gregorianDate.getDate();

    // Approximate conversion (Hijri year = Gregorian year - 622 + adjustment)
    const hijriYear = gregorianYear - 622;
    let hijriMonth = gregorianMonth;
    let hijriDay = gregorianDay;

    // Simple month adjustment (this is approximate and not astronomically accurate)
    if (gregorianMonth <= 2) {
      hijriMonth = gregorianMonth + 10;
    } else {
      hijriMonth = gregorianMonth - 2;
    }

    // Adjust day if needed
    if (hijriDay > 29) {
      hijriDay = 29; // Most Hijri months have 29 or 30 days
    }

    const hijriMonths = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى',
      'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];

    return `${hijriDay} ${hijriMonths[hijriMonth - 1]} ${hijriYear}`;
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

  const displayEvents = showAll ? events : events.slice(0, maxItems);

  const handleNavigateToEvents = () => {
    router.push('/events');
  };

  return (
    <Card>
      <CardContent>


        {displayEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {t('events.noEvents', 'No recent events')}
          </Typography>
        ) : (
          <List>
            {displayEvents.map((event, index) => (
              <React.Fragment key={event.id}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    py: 2
                  }}
                >
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="flex-start" 
                    mb={1}
                    sx={{ 
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      textAlign: isRTL ? 'right' : 'left'
                    }}
                  >
                    <Box flex={1}>
                      <Typography variant="subtitle2" component="h3" sx={{ mb: 0.5 }}>
                        {event.title}
                      </Typography>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        gap={1} 
                        mb={1} 
                        sx={{ 
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          justifyContent: isRTL ? 'flex-end' : 'flex-start',
                          textAlign: isRTL ? 'right' : 'left'
                        }}
                      >
                        <Chip
                          label={getEventTypeLabel(event.type, t)}
                          color={event.typeColor}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                          {formatEventDate(event.eventDate, event.eventTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {event.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {event.description}
                    </Typography>
                  )}
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center" 
                    sx={{ 
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      textAlign: isRTL ? 'right' : 'left'
                    }}
                  >
                    {isRTL ? (
                      // RTL: "By" on right, Location on left
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                          {t('common.by', 'By')} {event.author}
                        </Typography>
                        {event.location && (
                          <Box display="flex" alignItems="center" gap={0.5} sx={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {event.location}
                            </Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      // LTR: Location on left, "By" on right
                      <>
                        {event.location && (
                          <Box display="flex" alignItems="center" gap={0.5} sx={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {event.location}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                          {t('common.by', 'By')} {event.author}
                        </Typography>
                      </>
                    )}
                  </Box>
                </ListItem>
                {index < displayEvents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}