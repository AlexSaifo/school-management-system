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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PriorityHigh as PriorityHighIcon,
  Announcement as AnnouncementIcon,
} from '@mui/icons-material';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import DataTable, { Column, Action } from '@/components/DataTable';
import FilterPanel, { Filter, FilterOption, BulkAction } from '@/components/FilterPanel';
import PageHeader from '@/components/PageHeader';
import PaginationControls from '@/components/PaginationControls';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRoles: ('ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS')[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isActive: boolean;
  expiresAt?: string;
  createdBy: {
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

const priorityColors = {
  LOW: 'success',
  NORMAL: 'info',
  HIGH: 'warning',
  URGENT: 'error',
} as const;

const priorityIcons = {
  LOW: undefined,
  NORMAL: undefined,
  HIGH: <PriorityHighIcon fontSize="small" />,
  URGENT: <PriorityHighIcon fontSize="small" />,
};

// Column configuration for DataTable
const getColumns = (t: any): Column[] => [
  {
    key: 'title',
    label: t('common.title', 'Title'),
    sortable: true,
    render: (value: any, row: any) => (
      <Box display="flex" alignItems="center" gap={1}>
        <AnnouncementIcon color="action" />
        <Typography variant="body2" fontWeight="medium">
          {value}
        </Typography>
      </Box>
    ),
  },
  {
    key: 'priority',
    label: t('announcements.priority', 'Priority'),
    sortable: true,
    render: (value: any) => (
      <Chip
        label={t(`announcements.priority${value}`, value)}
        color={priorityColors[value as keyof typeof priorityColors]}
        size="small"
        icon={priorityIcons[value as keyof typeof priorityIcons]}
      />
    ),
  },
  {
    key: 'targetRoles',
    label: t('announcements.targetRoles', 'Target Roles'),
    render: (value: any) => (
      <Box display="flex" gap={0.5} flexWrap="wrap">
        {value.map((role: string) => (
          <Chip
            key={role}
            label={t(`users.roles.${role.toLowerCase()}`, role)}
            size="small"
            variant="outlined"
          />
        ))}
      </Box>
    ),
  },
  {
    key: 'isActive',
    label: t('announcements.status', 'Status'),
    render: (value: any) => (
      <Chip
        label={value ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
        color={value ? 'success' : 'default'}
        size="small"
      />
    ),
  },
  {
    key: 'createdBy',
    label: t('announcements.createdBy', 'Created by'),
    render: (value: any) => (
      <Box>
        <Typography variant="body2">
          {value.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t(`users.roles.${value.role.toLowerCase()}`, value.role)}
        </Typography>
      </Box>
    ),
  },
  {
    key: 'createdAt',
    label: t('announcements.createdAt', 'Created at'),
    sortable: true,
    render: (value: any) => (
      <Typography variant="body2">
        {new Date(value).toLocaleDateString()}
      </Typography>
    ),
  },
];

// Action configuration for DataTable
const getActions = (t: any, canManage: boolean, onView: (item: Announcement) => void, onEdit: (item: Announcement) => void, onDelete: (id: string) => void): Action[] => [
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
const getFilters = (t: any, priorityFilter: string, statusFilter: string, onPriorityChange: (value: string) => void, onStatusChange: (value: string) => void): Filter[] => [
  {
    key: 'priority',
    label: t('announcements.priority', 'Priority'),
    type: 'select',
    options: [
      { value: '', label: t('common.all', 'All') },
      { value: 'LOW', label: t('announcements.priorityLow', 'Low') },
      { value: 'NORMAL', label: t('announcements.priorityNormal', 'Normal') },
      { value: 'HIGH', label: t('announcements.priorityHigh', 'High') },
      { value: 'URGENT', label: t('announcements.priorityUrgent', 'Urgent') },
    ],
    value: priorityFilter,
    onChange: onPriorityChange,
  },
  {
    key: 'status',
    label: t('announcements.status', 'Status'),
    type: 'select',
    options: [
      { value: '', label: t('common.all', 'All') },
      { value: 'true', label: t('common.active', 'Active') },
      { value: 'false', label: t('common.inactive', 'Inactive') },
    ],
    value: statusFilter,
    onChange: onStatusChange,
  },
];

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();

  // State management
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRoles: ['ALL'] as ('ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS')[],
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    expiresAt: '',
  });

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Fetch announcements
  const fetchAnnouncements = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      if (searchTerm) params.append('search', searchTerm);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (statusFilter) params.append('isActive', statusFilter);
      
      // Add user role for filtering announcements
      if (user?.role) params.append('userRole', user.role);

      const response = await fetch(`/api/announcements?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.data.announcements);
        setPagination(data.data.pagination);
      } else {
        showSnackbar(t('announcements.fetchError', 'Failed to fetch announcements'), 'error');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showSnackbar(t('announcements.fetchErrorGeneric', 'Error fetching announcements'), 'error');
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
      const url = selectedAnnouncement
        ? `/api/announcements/${selectedAnnouncement.id}`
        : '/api/announcements';

      const method = selectedAnnouncement ? 'PUT' : 'POST';

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
          selectedAnnouncement ? t('announcements.updateSuccess', 'Announcement updated successfully') : t('announcements.createSuccess', 'Announcement created successfully'),
          'success'
        );
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        resetForm();
        fetchAnnouncements(pagination.current);
      } else {
        const error = await response.json();
        showSnackbar(error.error || t('announcements.saveError', 'Failed to save announcement'), 'error');
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      showSnackbar(t('announcements.saveErrorGeneric', 'Error saving announcement'), 'error');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm(t('announcements.deleteConfirm', 'Are you sure you want to delete this announcement?'))) return;

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showSnackbar(t('announcements.deleteSuccess', 'Announcement deleted successfully'), 'success');
        fetchAnnouncements(pagination.current);
      } else {
        showSnackbar(t('announcements.deleteError', 'Failed to delete announcement'), 'error');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showSnackbar(t('announcements.deleteErrorGeneric', 'Error deleting announcement'), 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      targetRoles: ['ALL'],
      priority: 'NORMAL',
      expiresAt: '',
    });
    setSelectedAnnouncement(null);
  };

  // Open edit dialog
  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetRoles: announcement.targetRoles,
      priority: announcement.priority,
      expiresAt: announcement.expiresAt || '',
    });
    setEditDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialogOpen(true);
  };

  // Handle role checkbox change (currently unused - using Select instead)
  // const handleRoleChange = (role: 'ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS', checked: boolean) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     targetRoles: checked
  //       ? [...prev.targetRoles, role]
  //       : prev.targetRoles.filter(r => r !== role),
  //   }));
  // };

  // Check if user can create/edit announcements
  const canManageAnnouncements = user?.role === 'ADMIN';

  useEffect(() => {
    fetchAnnouncements();
  }, [searchTerm, priorityFilter, statusFilter]);

  return (
    <SidebarLayout>
      <Box sx={{ p: 3 }}>
        {/* Page Header */}
        <PageHeader
          title={t('navigation.announcements', 'Announcements')}
          actionLabel={canManageAnnouncements ? t('common.create', 'Create') : undefined}
          actionIcon={canManageAnnouncements ? <AddIcon /> : undefined}
          onAction={canManageAnnouncements ? () => setCreateDialogOpen(true) : undefined}
        />

        {/* Filters */}
        <FilterPanel
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('announcements.searchAnnouncements', 'Search announcements...')}
          filters={getFilters(t, priorityFilter, statusFilter, setPriorityFilter, setStatusFilter)}
        />

        {/* Announcements Table */}
        <DataTable
          data={announcements}
          columns={getColumns(t)}
          actions={getActions(t, canManageAnnouncements, openViewDialog, openEditDialog, handleDelete)}
          loading={loading}
          emptyMessage={t('announcements.noAnnouncements', 'No announcements found')}
          selectable={false}
        />

        {/* Pagination */}
        <PaginationControls
          current={pagination.current}
          total={pagination.count}
          limit={pagination.limit}
          onPageChange={fetchAnnouncements}
          onPageSizeChange={(pageSize) => {
            // Update pagination limit and refetch
            setPagination(prev => ({ ...prev, limit: pageSize }));
            fetchAnnouncements(1);
          }}
        />

        {/* Create/Edit Dialog */}
        <Dialog
          open={createDialogOpen || editDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {createDialogOpen ? t('announcements.createAnnouncement', 'Create Announcement') : t('announcements.editAnnouncement', 'Edit Announcement')}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('common.title', 'Title')}
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label={t('common.content', 'Content')}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('announcements.priority', 'Priority')}</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      label={t('announcements.priority', 'Priority')}
                    >
                      <MenuItem value="LOW">{t('announcements.priorityLow', 'Low')}</MenuItem>
                      <MenuItem value="NORMAL">{t('announcements.priorityNormal', 'Normal')}</MenuItem>
                      <MenuItem value="HIGH">{t('announcements.priorityHigh', 'High')}</MenuItem>
                      <MenuItem value="URGENT">{t('announcements.priorityUrgent', 'Urgent')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label={t('announcements.expiresAt', 'Expires At (Optional)')}
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('announcements.targetAudience', 'Target Audience')}</InputLabel>
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
                              label={t(`announcements.targetRoles.${value.toLowerCase()}`, value)}
                              size="small"
                            />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="ALL">{t('announcements.targetRoles.all', 'All Users')}</MenuItem>
                      <MenuItem value="STUDENTS">{t('announcements.targetRoles.students', 'Students')}</MenuItem>
                      <MenuItem value="PARENTS">{t('announcements.targetRoles.parents', 'Parents')}</MenuItem>
                      <MenuItem value="TEACHERS">{t('announcements.targetRoles.teachers', 'Teachers')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  resetForm();
                }}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" variant="contained">
                {createDialogOpen ? t('common.create', 'Create') : t('common.save', 'Save')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* View Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedAnnouncement?.title}
          </DialogTitle>
          <DialogContent>
            {selectedAnnouncement && (
              <Box>
                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    label={t(`announcements.priority${selectedAnnouncement.priority}`, selectedAnnouncement.priority)}
                    color={priorityColors[selectedAnnouncement.priority]}
                    size="small"
                    icon={priorityIcons[selectedAnnouncement.priority]}
                  />
                  <Chip
                    label={selectedAnnouncement.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                    color={selectedAnnouncement.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body1" paragraph>
                  {selectedAnnouncement.content}
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    {t('announcements.targetRoles', 'Target Roles')}:
                  </Typography>
                  {selectedAnnouncement.targetRoles.map((role) => (
                    <Chip
                      key={role}
                      label={t(`users.roles.${role.toLowerCase()}`, role)}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t('common.createdBy', 'Created by')}: {selectedAnnouncement.createdBy.name} ({t(`users.roles.${selectedAnnouncement.createdBy.role.toLowerCase()}`, selectedAnnouncement.createdBy.role)})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('common.createdAt', 'Created at')}: {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                </Typography>
                {selectedAnnouncement.expiresAt && (
                  <Typography variant="body2" color="text.secondary">
                    {t('announcements.expiresAt', 'Expires at')}: {new Date(selectedAnnouncement.expiresAt).toLocaleString()}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
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

        {/* Floating Action Button for Mobile */}
        {canManageAnnouncements && (
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setCreateDialogOpen(true)}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>
    </SidebarLayout>
  );
}
