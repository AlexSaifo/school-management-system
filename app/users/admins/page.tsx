'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  Tooltip,
  Alert,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  Pagination,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PersonAdd,
  AdminPanelSettings,
  Search,
  FilterList,
  MoreVert,
  GetApp,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DataTable, { Column, Action } from '@/components/DataTable';
import FilterPanel, { Filter, FilterOption, BulkAction } from '@/components/FilterPanel';
import PageHeader from '@/components/PageHeader';
import PaginationControls from '@/components/PaginationControls';
import { useTranslation } from 'react-i18next';

interface Admin {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  permissions: {
    canManageUsers: boolean;
    canViewReports: boolean;
    canManageSystem: boolean;
    canManageClasses: boolean;
  };
}

export default function AdminsPage() {
  const { user, token } = useAuth();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();
  const locale = isRTL ? 'ar' : 'en-US'; // Use 'ar' instead of 'ar-SA' to avoid Hijri calendar as default
  // Define date format options to force Gregorian calendar
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric", 
    month: "long", 
    day: "numeric",
    calendar: "gregory" // Force Gregorian calendar
  };
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewAdmin, setViewAdmin] = useState<Admin | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    count: 0,
    limit: 10,
  });
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    permissions: {
      canManageUsers: false,
      canViewReports: false,
      canManageSystem: false,
      canManageClasses: false,
    },
  });



  const availablePermissions = [
    { key: 'canManageUsers', label: t('admins.permissionsList.canManageUsers') },
    { key: 'canViewReports', label: t('admins.permissionsList.canViewReports') },
    { key: 'canManageSystem', label: t('admins.permissionsList.canManageSystem') },
    { key: 'canManageClasses', label: t('admins.permissionsList.canManageClasses') },
  ];

  useEffect(() => {
    if (token) {
      fetchAdmins(1); // Reset to page 1 when search/filter changes
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [token, searchTerm, statusFilter, pageSize]);

  const fetchAdmins = async (page = pagination.current) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      const response = await fetch(`/api/users/admins?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const response_data = await response.json();
        setAdmins(response_data.data?.admins || []);
        setPagination(response_data.data?.pagination || {
          current: 1,
          total: 0,
          count: 0,
          limit: pageSize,
        });
      } else {
        console.error('Failed to fetch admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (admin?: Admin) => {
    if (admin) {
      setSelectedAdmin(admin);
      setFormData({
        firstName: admin.user.firstName,
        lastName: admin.user.lastName,
        email: admin.user.email,
        phoneNumber: admin.user.phoneNumber || '',
        address: admin.user.address || '',
        permissions: admin.permissions || {
          canManageUsers: false,
          canViewReports: false,
          canManageSystem: false,
          canManageClasses: false,
        },
      });
    } else {
      setSelectedAdmin(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        permissions: {
          canManageUsers: false,
          canViewReports: false,
          canManageSystem: false,
          canManageClasses: false,
        },
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAdmin(null);
  };

  const handleSubmit = async () => {
    try {
      const url = selectedAdmin 
        ? `/api/users/admins/${selectedAdmin.id}` 
        : '/api/users/admins';
      
      const method = selectedAdmin ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchAdmins(pagination.current);
        handleCloseDialog();
      } else {
        console.error('Failed to save admin');
      }
    } catch (error) {
      console.error('Error saving admin:', error);
    }
  };

  const handleDelete = async (adminId: string) => {
    if (window.confirm(t('admins.confirmations.deleteSingle'))) {
      try {
        const response = await fetch(`/api/users/admins/${adminId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchAdmins(pagination.current);
        } else {
          console.error('Failed to delete admin');
        }
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/admins/${adminId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchAdmins(pagination.current);
      } else {
        console.error('Failed to toggle admin status');
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    const confirmMessage = t('admins.confirmations.bulkAction', { action: t(`admins.actions.${action}`), count: selectedIds.length });
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch('/api/users/admins', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          userIds: selectedIds,
        }),
      });

      if (response.ok) {
        setSelectedIds([]);
        fetchAdmins(pagination.current);
      } else {
        console.error(`Failed to ${action} admins`);
      }
    } catch (error) {
      console.error(`Error ${action} admins:`, error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(admins.map(admin => admin.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleViewAdmin = (admin: Admin) => {
    setViewAdmin(admin);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewAdmin(null);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, current: value }));
    fetchAdmins(value);
  };

  const handlePageSizeChange = (event: any) => {
    const newPageSize = parseInt(event.target.value);
    setPageSize(newPageSize);
    setPagination(prev => ({ ...prev, current: 1, limit: newPageSize }));
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Permissions', 'Status', 'Joined'];
    const rows = admins.map(admin => [
      `${admin.user.firstName} ${admin.user.lastName}`,
      admin.user.email,
      admin.user.phoneNumber || 'N/A',
      admin.user.address || 'N/A',
      Object.entries(admin.permissions)
        .filter(([key, value]) => value)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
        .join(', '),
      admin.user.isActive ? 'Active' : 'Inactive',
      new Date(admin.user.createdAt).toLocaleDateString(locale, dateFormatOptions),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admins.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <SidebarLayout>
        <Alert severity="error">
          {t('admins.errors.noPermission')}
        </Alert>
      </SidebarLayout>
    );
  }

  // Define table columns
  const columns: Column[] = [
    {
      key: 'user.firstName',
      label: t('admins.table.headers.admin'),
      render: (value, row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      key: 'user.phoneNumber',
      label: t('admins.table.headers.contact'),
      render: (value, row) => (
        <Box>
          <div>{row.user.phoneNumber || t('admins.table.noPhone')}</div>
          <div style={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {row.user.address || t('admins.table.noAddress')}
          </div>
        </Box>
      ),
    },
    {
      key: 'permissions',
      label: t('admins.table.headers.permissions'),
      render: (value, row) => {
        const enabledPermissions = row.permissions
          ? Object.entries(row.permissions)
              .filter(([key, val]) => Boolean(val))
              .map(([key]) => key)
          : [];
        const displayPermissions = enabledPermissions.slice(0, 2);
        const remainingCount = enabledPermissions.length - 2;

        return (
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {displayPermissions.map((permission) => (
              <Chip
                key={permission}
                label={permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                size="small"
                variant="outlined"
              />
            ))}
            {remainingCount > 0 && (
              <Chip
                label={`+${remainingCount}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        );
      },
    },
    {
      key: 'user.isActive',
      label: t('admins.table.headers.status'),
    },
    {
      key: 'user.createdAt',
      label: t('admins.table.headers.joined'),
      render: (value) => new Date(value).toLocaleDateString(locale, dateFormatOptions),
    },
  ];

  // Define table actions
  const actions: Action[] = [
    {
      key: 'view',
      label: t('admins.actions.view'),
      icon: <Visibility />,
      onClick: (row) => handleViewAdmin(row),
    },
    {
      key: 'edit',
      label: t('admins.actions.edit'),
      icon: <Edit />,
      onClick: (row) => handleOpenDialog(row),
    },
    {
      key: 'toggleStatus',
      label: row => row.user.isActive ? t('admins.actions.deactivate') : t('admins.actions.activate'),
      icon: row => row.user.isActive ? <Block /> : <CheckCircle />,
      onClick: (row) => toggleAdminStatus(row.id, row.user.isActive),
      color: row => row.user.isActive ? 'warning' : 'success',
    },
    {
      key: 'delete',
      label: t('admins.actions.delete'),
      icon: <Delete />,
      onClick: (row) => handleDelete(row.id),
      color: 'error',
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'activate',
      label: 'Activate',
      icon: <CheckCircle />,
      onClick: () => handleBulkAction('activate'),
      color: 'success',
    },
    {
      key: 'deactivate',
      label: 'Deactivate',
      icon: <Block />,
      onClick: () => handleBulkAction('deactivate'),
      color: 'warning',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Delete />,
      onClick: () => handleBulkAction('delete'),
      color: 'error',
    },
  ];

  return (
    <SidebarLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('admins.title')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => handleOpenDialog()}
          >
            {t('admins.addNew')}
          </Button>
        </Box>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder={t('admins.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label={t('admins.filters.status')}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">{t('admins.filters.allStatus')}</MenuItem>
              <MenuItem value="active">{t('admins.status.active')}</MenuItem>
              <MenuItem value="inactive">{t('admins.status.inactive')}</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={() => fetchAdmins(1)}
            >
              {t('admins.search.button')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToCSV}
            >
              {t('admins.export.csv')}
            </Button>
            {selectedIds.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleBulkAction('activate')}
                >
                  {t('admins.actions.activate')} ({selectedIds.length})
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Block />}
                  onClick={() => handleBulkAction('deactivate')}
                >
                  {t('admins.actions.deactivate')} ({selectedIds.length})
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleBulkAction('delete')}
                >
                  {t('admins.actions.delete')} ({selectedIds.length})
                </Button>
              </>
            )}
          </Box>
        </Paper>

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && selectedIds.length < admins.length}
                      checked={admins.length > 0 && selectedIds.length === admins.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>{t('admins.table.headers.admin')}</TableCell>
                  <TableCell>{t('admins.table.headers.contact')}</TableCell>
                  <TableCell>{t('admins.table.headers.permissions')}</TableCell>
                  <TableCell>{t('admins.table.headers.status')}</TableCell>
                  <TableCell>{t('admins.table.headers.joined')}</TableCell>
                  <TableCell align="center">{t('admins.table.headers.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {t('admins.table.noAdminsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(admin.id)}
                          onChange={(e) => handleSelectOne(admin.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar>
                            <AdminPanelSettings />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {admin.user.firstName} {admin.user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {admin.user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {admin.user.phoneNumber || 'No phone'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {admin.user.address || 'No address'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {(() => {
                            const enabledPermissions = admin.permissions 
                              ? Object.entries(admin.permissions)
                                  .filter(([key, value]) => Boolean(value))
                                  .map(([key]) => key)
                              : [];
                            return enabledPermissions.slice(0, 2).map((permission) => (
                              <Chip 
                                key={permission} 
                                label={permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()} 
                                size="small" 
                                variant="outlined"
                              />
                            ));
                          })()}
                          {(() => {
                            const enabledPermissions = admin.permissions 
                              ? Object.entries(admin.permissions)
                                  .filter(([key, value]) => Boolean(value))
                                  .map(([key]) => key)
                              : [];
                            return enabledPermissions.length > 2 && (
                              <Chip 
                                label={`+${enabledPermissions.length - 2}`} 
                                size="small" 
                                variant="outlined"
                              />
                            );
                          })()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={admin.user.isActive ? 'Active' : 'Inactive'}
                          color={admin.user.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(admin.user.createdAt).toLocaleDateString(locale, dateFormatOptions)}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('admins.actions.view')}>
                          <IconButton 
                            size="small"
                            onClick={() => handleViewAdmin(admin)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('admins.actions.edit')}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(admin)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={admin.user.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton 
                            size="small"
                            onClick={() => toggleAdminStatus(admin.id, admin.user.isActive)}
                          >
                            {admin.user.isActive ? <Delete /> : <Add />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pagination Controls */}
        <Paper sx={{ p: 2, mt: 2 }}>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary">
                {t('admins.pagination.showing')} {((pagination.current - 1) * pagination.limit) + 1} {t('admins.pagination.to')}{' '}
                {Math.min(pagination.current * pagination.limit, pagination.total)} {t('admins.pagination.of')}{' '}
                {pagination.total} {t('admins.pagination.admins')}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>{t('admins.pagination.perPage')}</InputLabel>
                <Select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  label="Per page"
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Pagination
              count={Math.ceil(pagination.total / pagination.limit)}
              page={pagination.current}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              siblingCount={2}
              boundaryCount={1}
            />
          </Box>
        </Paper>

        {/* Add/Edit Admin Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedAdmin ? t('admins.dialog.editTitle') : t('admins.addNew')}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Box display="flex" gap={2}>
                <TextField
                  label={t('admins.form.firstName')}
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  fullWidth
                  required
                />
                <TextField
                  label={t('admins.form.lastName')}
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label={t('admins.form.email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                fullWidth
                required
              />
              <Box display="flex" gap={2}>
                <TextField
                  label={t('admins.form.phoneNumber')}
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  fullWidth
                />
                <TextField
                  label={t('admins.form.address')}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  fullWidth
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('admins.form.permissions')}
                </Typography>
                {availablePermissions.map((permission) => (
                  <FormControlLabel
                    key={permission.key}
                    control={
                      <Checkbox
                        checked={formData.permissions[permission.key as keyof typeof formData.permissions] || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [permission.key]: e.target.checked
                          }
                        })}
                      />
                    }
                    label={permission.label}
                  />
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('admins.dialog.cancel')}</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedAdmin ? t('admins.dialog.update') : t('admins.dialog.create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Admin Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={handleCloseViewDialog} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar>
                <AdminPanelSettings />
              </Avatar>
              {t('admins.dialog.viewTitle')}
            </Box>
          </DialogTitle>
          <DialogContent>
            {viewAdmin && (
              <Box display="flex" flexDirection="column" gap={3} mt={2}>
                {/* Basic Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('admins.view.basicInfo')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('admins.form.firstName')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewAdmin.user.firstName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('admins.form.lastName')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewAdmin.user.lastName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('admins.view.emailAddress')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewAdmin.user.email}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('admins.table.headers.status')}
                      </Typography>
                      <Chip
                        label={viewAdmin.user.isActive ? t('admins.status.active') : t('admins.status.inactive')}
                        color={viewAdmin.user.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Paper>

                {/* Contact Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('admins.view.contactInfo')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('admins.form.phoneNumber')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewAdmin.user.phoneNumber || t('admins.view.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('admins.form.address')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewAdmin.user.address || t('admins.view.notProvided')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Permissions */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('admins.view.permissions')}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {Object.entries(viewAdmin.permissions || {}).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                        color={value ? 'primary' : 'default'}
                        variant={value ? 'filled' : 'outlined'}
                        size="small"
                        icon={value ? <CheckCircle /> : undefined}
                      />
                    ))}
                  </Box>
                </Paper>

                {/* Account Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('admins.view.accountInfo')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('admins.view.accountCreated')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {new Date(viewAdmin.user.createdAt).toLocaleDateString(locale, dateFormatOptions)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('admins.view.lastUpdated')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {new Date(viewAdmin.user.updatedAt).toLocaleDateString(locale, dateFormatOptions)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('admins.view.adminId')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" fontFamily="monospace">
                        {viewAdmin.id}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDialog}>{t('admins.dialog.close')}</Button>
            <Button 
              onClick={() => {
                handleCloseViewDialog();
                if (viewAdmin) handleOpenDialog(viewAdmin);
              }}
              variant="contained"
              startIcon={<Edit />}
            >
              {t('admins.actions.edit')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
