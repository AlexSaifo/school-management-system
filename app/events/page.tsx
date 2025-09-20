'use client';

import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Chip,
  Tooltip,
  Fab,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PriorityHigh as PriorityHighIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import DataTable, { Column, Action } from '@/components/DataTable';
import FilterPanel, { Filter, FilterOption, BulkAction } from '@/components/FilterPanel';
import PageHeader from '@/components/PageHeader';
import PaginationControls from '@/components/PaginationControls';

interface Event {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  locationAr?: string;
  type: 'GENERAL' | 'ACADEMIC' | 'SPORTS' | 'CULTURAL' | 'MEETING' | 'HOLIDAY' | 'EXAM';
  targetRoles?: ('ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS')[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Event type colors
const eventTypeColors = {
  GENERAL: 'default',
  ACADEMIC: 'primary',
  SPORTS: 'success',
  CULTURAL: 'secondary',
  MEETING: 'info',
  HOLIDAY: 'warning',
  EXAM: 'error',
} as const;

// Column configuration for DataTable
const getColumns = (t: any, language: string): Column[] => [
  {
    key: 'title',
    label: t('events.eventName', 'Event Name'),
    sortable: true,
    render: (value: any, row: Event) => {
      const displayTitle = language === 'ar' && row.titleAr ? row.titleAr : value;
      const displayDescription = language === 'ar' && row.descriptionAr ? row.descriptionAr : row.description;
      
      return (
        <Box>
          <Typography variant="body2" fontWeight="medium" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {displayTitle}
          </Typography>
          {displayDescription && (
            <Typography variant="caption" color="text.secondary" display="block" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {displayDescription.length > 50 ? `${displayDescription.substring(0, 50)}...` : displayDescription}
            </Typography>
          )}
        </Box>
      );
    },
  },
  {
    key: 'eventDate',
    label: t('events.eventDate', 'Event Date'),
    sortable: true,
    render: (value: any) => (
      <Typography variant="body2">
        {new Date(value).toLocaleDateString()}
      </Typography>
    ),
  },
  {
    key: 'eventTime',
    label: t('events.eventTime', 'Event Time'),
    render: (value: any) => (
      <Typography variant="body2">
        {value || t('common.notProvided', 'Not provided')}
      </Typography>
    ),
  },
  {
    key: 'location',
    label: t('events.location', 'Location'),
    render: (value: any, row: Event) => {
      const displayLocation = language === 'ar' && row.locationAr ? row.locationAr : value;
      return (
        <Typography variant="body2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {displayLocation || t('common.notProvided', 'Not provided')}
        </Typography>
      );
    },
  },
  {
    key: 'type',
    label: t('events.type', 'Type'),
    render: (value: any) => (
      <Chip
        label={t(`events.types.${value.toLowerCase()}`, value)}
        color={eventTypeColors[value as keyof typeof eventTypeColors] || 'default'}
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    key: 'creator',
    label: t('events.createdBy', 'Created by'),
    render: (value: any) => (
      <Box>
        <Typography variant="body2">
          {value.firstName} {value.lastName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {value.email}
        </Typography>
      </Box>
    ),
  },
];

// Action configuration for DataTable
const getActions = (t: any, canManage: boolean, onView: (item: Event) => void, onEdit: (item: Event) => void, onDelete: (id: string) => void): Action[] => [
  {
    key: 'view',
    label: t('common.view', 'View'),
    icon: <ViewIcon />,
    onClick: onView,
  },
  ...(canManage ? [
    {
      key: 'edit',
      label: t('common.edit', 'Edit'),
      icon: <EditIcon />,
      onClick: onEdit,
    },
    {
      key: 'delete',
      label: t('common.delete', 'Delete'),
      icon: <DeleteIcon />,
      onClick: (item: any) => onDelete(item.id),
      color: 'error' as const,
    },
  ] : []),
];

// Filter configuration for FilterPanel
const getFilters = (t: any, typeFilter: string, onTypeChange: (value: string) => void): Filter[] => [
  {
    key: 'type',
    label: t('events.type', 'Type'),
    type: 'select',
    options: [
      { value: '', label: t('common.all', 'All') },
      { value: 'GENERAL', label: t('events.types.general', 'General') },
      { value: 'ACADEMIC', label: t('events.types.academic', 'Academic') },
      { value: 'SPORTS', label: t('events.types.sports', 'Sports') },
      { value: 'CULTURAL', label: t('events.types.cultural', 'Cultural') },
      { value: 'MEETING', label: t('events.types.meeting', 'Meeting') },
      { value: 'HOLIDAY', label: t('events.types.holiday', 'Holiday') },
      { value: 'EXAM', label: t('events.types.exam', 'Exam') },
    ],
    value: typeFilter,
    onChange: onTypeChange,
  },
];

export default function EventsPage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { language } = useLanguage();

  // State management
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    limit: 10,
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    eventDate: '',
    eventTime: '',
    location: '',
    locationAr: '',
    type: 'GENERAL' as Event['type'],
    targetRoles: ['ALL'] as ('ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS')[],
  });

  // Tab state for multilingual form
  const [activeTab, setActiveTab] = useState(0);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  const canManage = user?.role === 'ADMIN';

  // Fetch events
  const fetchEvents = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`/api/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        setPagination({
          current: data.pagination.page,
          total: data.pagination.pages,
          count: data.pagination.total,
          limit: data.pagination.limit,
        });
      } else {
        showSnackbar(t('events.fetchError', 'Failed to fetch events'), 'error');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      showSnackbar(t('events.fetchErrorGeneric', 'Error fetching events'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = selectedEvent
        ? `/api/events/${selectedEvent.id}`
        : '/api/events/notify';

      const method = selectedEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSnackbar(
          selectedEvent
            ? t('events.updateSuccess', 'Event updated successfully')
            : t('events.createSuccess', 'Event created successfully'),
          'success'
        );
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        setSelectedEvent(null);
        resetForm();
        fetchEvents(pagination.current);
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || t('events.saveErrorGeneric', 'Error saving event'), 'error');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      showSnackbar(t('events.saveErrorGeneric', 'Error saving event'), 'error');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(t('events.deleteConfirm', 'Are you sure you want to delete this event?'))) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showSnackbar(t('events.deleteSuccess', 'Event deleted successfully'), 'success');
        fetchEvents(pagination.current);
      } else {
        showSnackbar(t('events.deleteError', 'Failed to delete event'), 'error');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showSnackbar(t('events.deleteErrorGeneric', 'Error deleting event'), 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      eventDate: '',
      eventTime: '',
      location: '',
      locationAr: '',
      type: 'GENERAL',
      targetRoles: ['ALL'],
    });
    setActiveTab(0);
  };

  // Handle view
  const handleView = (event: Event) => {
    setSelectedEvent(event);
    setViewDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      titleAr: event.titleAr || '',
      description: event.description || '',
      descriptionAr: event.descriptionAr || '',
      eventDate: event.eventDate.split('T')[0], // Format for date input
      eventTime: event.eventTime || '',
      location: event.location || '',
      locationAr: event.locationAr || '',
      type: event.type,
      targetRoles: (event as any).targetRoles || ['ALL'],
    });
    setEditDialogOpen(true);
  };

  // Handle create
  const handleCreate = () => {
    resetForm();
    setSelectedEvent(null);
    setCreateDialogOpen(true);
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
    fetchEvents(page);
  };

  // Effect for initial load and search/filter changes
  useEffect(() => {
    fetchEvents(1);
  }, [searchTerm, typeFilter]);

  return (
    <SidebarLayout>
      <Box>
        <PageHeader
          title={t('events.title', 'Events Management')}
          subtitle={t('events.subtitle', 'Manage school events and activities')}
          actionLabel={canManage ? t('events.createEvent', 'Create Event') : undefined}
          actionIcon={canManage ? <AddIcon /> : undefined}
          onAction={canManage ? handleCreate : undefined}
        />

        <Box sx={{ mb: 3 }}>
          <FilterPanel
            searchPlaceholder={t('events.searchPlaceholder', 'Search events...')}
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            filters={getFilters(t, typeFilter, setTypeFilter)}
          />
        </Box>

        <DataTable
          data={events}
          columns={getColumns(t, language)}
          actions={getActions(t, canManage, handleView, handleEdit, handleDelete)}
          loading={loading}
          emptyMessage={t('events.noEvents', 'No events found')}
        />

        <PaginationControls
          current={pagination.current}
          total={pagination.count}
          limit={pagination.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={(pageSize) => {
            setPagination(prev => ({ ...prev, limit: pageSize, current: 1 }));
            fetchEvents(1);
          }}
        />

        {/* Create Event Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={handleSubmit}>
            <DialogTitle>{t('events.createEvent', 'Create Event')}</DialogTitle>
            <DialogContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                  <Tab label={t('common.english', 'English')} />
                  <Tab label={t('common.arabic', 'العربية')} />
                </Tabs>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {activeTab === 0 && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('events.eventName', 'Event Name')}
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t('events.description', 'Description')}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('events.location', 'Location')}
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </Grid>
                  </>
                )}
                
                {activeTab === 1 && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('events.eventNameAr', 'اسم الحدث')}
                        value={formData.titleAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, titleAr: e.target.value }))}
                        required
                        dir="rtl"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t('events.descriptionAr', 'الوصف')}
                        value={formData.descriptionAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                        dir="rtl"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('events.locationAr', 'الموقع')}
                        value={formData.locationAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, locationAr: e.target.value }))}
                        dir="rtl"
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t('events.eventDate', 'Event Date')}
                    value={formData.eventDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label={t('events.eventTime', 'Event Time')}
                    value={formData.eventTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('events.type', 'Type')}</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Event['type'] }))}
                    >
                      <MenuItem value="GENERAL">{t('events.types.general', 'General')}</MenuItem>
                      <MenuItem value="ACADEMIC">{t('events.types.academic', 'Academic')}</MenuItem>
                      <MenuItem value="SPORTS">{t('events.types.sports', 'Sports')}</MenuItem>
                      <MenuItem value="CULTURAL">{t('events.types.cultural', 'Cultural')}</MenuItem>
                      <MenuItem value="MEETING">{t('events.types.meeting', 'Meeting')}</MenuItem>
                      <MenuItem value="HOLIDAY">{t('events.types.holiday', 'Holiday')}</MenuItem>
                      <MenuItem value="EXAM">{t('events.types.exam', 'Exam')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('events.targetAudience', 'Target Audience')}</InputLabel>
                    <Select
                      multiple
                      value={formData.targetRoles}
                      onChange={(e) => {
                        const value = e.target.value as ('ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS')[];
                        // If ALL is selected, only select ALL
                        if (value.includes('ALL') && !formData.targetRoles.includes('ALL')) {
                          setFormData(prev => ({ ...prev, targetRoles: ['ALL'] }));
                        } else if (!value.includes('ALL') && formData.targetRoles.includes('ALL')) {
                          // If ALL is deselected, allow selecting specific roles
                          setFormData(prev => ({ ...prev, targetRoles: value.filter(v => v !== 'ALL') }));
                        } else {
                          setFormData(prev => ({ ...prev, targetRoles: value }));
                        }
                      }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={t(`events.targetRoles.${value.toLowerCase()}`, value)}
                              size="small"
                            />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="ALL">{t('events.targetRoles.all', 'All Users')}</MenuItem>
                      <MenuItem value="STUDENTS">{t('events.targetRoles.students', 'Students')}</MenuItem>
                      <MenuItem value="PARENTS">{t('events.targetRoles.parents', 'Parents')}</MenuItem>
                      <MenuItem value="TEACHERS">{t('events.targetRoles.teachers', 'Teachers')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateDialogOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" variant="contained">
                {t('common.create', 'Create')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={handleSubmit}>
            <DialogTitle>{t('events.editEvent', 'Edit Event')}</DialogTitle>
            <DialogContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                  <Tab label={t('common.english', 'English')} />
                  <Tab label={t('common.arabic', 'العربية')} />
                </Tabs>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {activeTab === 0 && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('events.eventName', 'Event Name')}
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t('events.description', 'Description')}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('events.location', 'Location')}
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </Grid>
                  </>
                )}
                
                {activeTab === 1 && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('events.eventNameAr', 'اسم الحدث')}
                        value={formData.titleAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, titleAr: e.target.value }))}
                        required
                        dir="rtl"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t('events.descriptionAr', 'الوصف')}
                        value={formData.descriptionAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                        dir="rtl"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('events.locationAr', 'الموقع')}
                        value={formData.locationAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, locationAr: e.target.value }))}
                        dir="rtl"
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t('events.eventDate', 'Event Date')}
                    value={formData.eventDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label={t('events.eventTime', 'Event Time')}
                    value={formData.eventTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('events.type', 'Type')}</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Event['type'] }))}
                    >
                      <MenuItem value="GENERAL">{t('events.types.general', 'General')}</MenuItem>
                      <MenuItem value="ACADEMIC">{t('events.types.academic', 'Academic')}</MenuItem>
                      <MenuItem value="SPORTS">{t('events.types.sports', 'Sports')}</MenuItem>
                      <MenuItem value="CULTURAL">{t('events.types.cultural', 'Cultural')}</MenuItem>
                      <MenuItem value="MEETING">{t('events.types.meeting', 'Meeting')}</MenuItem>
                      <MenuItem value="HOLIDAY">{t('events.types.holiday', 'Holiday')}</MenuItem>
                      <MenuItem value="EXAM">{t('events.types.exam', 'Exam')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('events.targetAudience', 'Target Audience')}</InputLabel>
                    <Select
                      multiple
                      value={formData.targetRoles}
                      onChange={(e) => {
                        const value = e.target.value as ('ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS')[];
                        // If ALL is selected, only select ALL
                        if (value.includes('ALL') && !formData.targetRoles.includes('ALL')) {
                          setFormData(prev => ({ ...prev, targetRoles: ['ALL'] }));
                        } else if (!value.includes('ALL') && formData.targetRoles.includes('ALL')) {
                          // If ALL is deselected, allow selecting specific roles
                          setFormData(prev => ({ ...prev, targetRoles: value.filter(v => v !== 'ALL') }));
                        } else {
                          setFormData(prev => ({ ...prev, targetRoles: value }));
                        }
                      }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={t(`events.targetRoles.${value.toLowerCase()}`, value)}
                              size="small"
                            />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="ALL">{t('events.targetRoles.all', 'All Users')}</MenuItem>
                      <MenuItem value="STUDENTS">{t('events.targetRoles.students', 'Students')}</MenuItem>
                      <MenuItem value="PARENTS">{t('events.targetRoles.parents', 'Parents')}</MenuItem>
                      <MenuItem value="TEACHERS">{t('events.targetRoles.teachers', 'Teachers')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" variant="contained">
                {t('common.update', 'Update')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* View Event Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{t('events.viewEvent', 'View Event')}</DialogTitle>
          <DialogContent>
            {selectedEvent && (
              <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    <Tab label={t('common.english', 'English')} />
                    <Tab label={t('common.arabic', 'العربية')} />
                  </Tabs>
                </Box>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {activeTab === 0 && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="h6">{selectedEvent.title}</Typography>
                      </Grid>
                      {selectedEvent.description && (
                        <Grid item xs={12}>
                          <Typography variant="body1">{selectedEvent.description}</Typography>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('events.location', 'Location')}:
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.location || t('common.notProvided', 'Not provided')}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {activeTab === 1 && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="h6" dir="rtl">
                          {selectedEvent.titleAr || selectedEvent.title}
                        </Typography>
                      </Grid>
                      {(selectedEvent.descriptionAr || selectedEvent.description) && (
                        <Grid item xs={12}>
                          <Typography variant="body1" dir="rtl">
                            {selectedEvent.descriptionAr || selectedEvent.description}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('events.locationAr', 'الموقع')}:
                        </Typography>
                        <Typography variant="body1" dir="rtl">
                          {selectedEvent.locationAr || selectedEvent.location || t('common.notProvided', 'غير محدد')}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('events.eventDate', 'Event Date')}:
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedEvent.eventDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('events.eventTime', 'Event Time')}:
                    </Typography>
                    <Typography variant="body1">
                      {selectedEvent.eventTime || t('common.notProvided', 'Not provided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('events.type', 'Type')}:
                    </Typography>
                    <Chip
                      label={t(`events.types.${selectedEvent.type.toLowerCase()}`, selectedEvent.type)}
                      color={eventTypeColors[selectedEvent.type as keyof typeof eventTypeColors] || 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('events.createdBy', 'Created by')}:
                    </Typography>
                    <Typography variant="body1">
                      {selectedEvent.creator.firstName} {selectedEvent.creator.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedEvent.creator.email}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </SidebarLayout>
  );
}
