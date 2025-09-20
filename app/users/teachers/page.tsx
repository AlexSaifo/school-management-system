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
  InputAdornment,
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
  School,
  Search,
  GetApp,
  Block,
  CheckCircle,
  Assignment,
} from '@mui/icons-material';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import DataTable, { Column, Action } from '@/components/DataTable';
import FilterPanel, { Filter, FilterOption, BulkAction } from '@/components/FilterPanel';
import TeacherSubjectManager from '@/components/TeacherSubjectManager';
import PageHeader from '@/components/PageHeader';
import PaginationControls from '@/components/PaginationControls';

interface Teacher {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    isActive: boolean; // For backward compatibility
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    createdAt: string;
    updatedAt: string;
  };
  employeeId: string;
  subjects: Array<{
    id: string;
    name: string;
    nameAr: string;
    code: string;
  }>;
  qualification: string;
  experience: number;
  salary?: number;
  joinDate: string;
}

export default function TeachersPage() {
  const { user, token } = useAuth();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const locale = isRTL ? 'ar' : 'en-US'; // Use 'ar' instead of 'ar-SA' to avoid Hijri calendar as default
  // Define date format options to force Gregorian calendar
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric", 
    month: "long", 
    day: "numeric"
    // Removed calendar: "gregory" to prevent hydration mismatches
  };
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);
  const [subjectManagerOpen, setSubjectManagerOpen] = useState(false);
  const [subjectManagerTeacher, setSubjectManagerTeacher] = useState<Teacher | null>(null);
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
    employeeId: '',
    qualification: '',
    experience: 0,
    salary: 0,
    joinDate: '',
  });
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    employeeId: '',
    qualification: '',
    experience: '',
    salary: '',
    joinDate: '',
  });

  useEffect(() => {
    if (token) {
      fetchTeachers(1);
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [token, searchTerm, statusFilter, pageSize]);

  const fetchTeachers = async (page = pagination.current) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      const response = await fetch(`/api/users/teachers?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const response_data = await response.json();
        setTeachers(response_data.data?.teachers || []);
        setPagination(response_data.data?.pagination || {
          current: 1,
          total: 0,
          count: 0,
          limit: pageSize,
        });
      } else {
        console.error('Failed to fetch teachers');
        showSnackbar(t('teachers.errors.fetchFailed'));
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: '',
      employeeId: '',
      qualification: '',
      experience: '',
      salary: '',
      joinDate: '',
    };

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = t('teachers.errors.firstNameRequired');
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = t('teachers.errors.lastNameRequired');
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = t('teachers.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('teachers.errors.emailInvalid');
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = t('teachers.errors.phoneNumberRequired');
    } else if (formData.phoneNumber.length < 10) {
      errors.phoneNumber = t('teachers.errors.phoneNumberTooShort');
    }

    // Address validation
    if (!formData.address.trim()) {
      errors.address = t('teachers.errors.addressRequired');
    }

    // Employee ID validation
    if (!formData.employeeId.trim()) {
      errors.employeeId = t('teachers.errors.employeeIdRequired');
    }

    // Qualification validation
    if (!formData.qualification.trim()) {
      errors.qualification = t('teachers.errors.qualificationRequired');
    }

    // Experience validation
    if (formData.experience < 0) {
      errors.experience = t('teachers.errors.experienceInvalid');
    }

    // Join date validation
    if (!formData.joinDate) {
      errors.joinDate = t('teachers.errors.joinDateRequired');
    }

    setFormErrors(errors);

    // Return true if no errors
    return Object.values(errors).every(error => error === '');
  };

  const handleOpenDialog = (teacher?: Teacher) => {
    // Clear any previous form errors
    setFormErrors({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: '',
      employeeId: '',
      qualification: '',
      experience: '',
      salary: '',
      joinDate: '',
    });

    if (teacher) {
      setSelectedTeacher(teacher);
      setFormData({
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        phoneNumber: teacher.user.phoneNumber || '',
        address: teacher.user.address || '',
        employeeId: teacher.employeeId,
        qualification: teacher.qualification,
        experience: teacher.experience,
        salary: teacher.salary || 0,
        joinDate: teacher.joinDate ? teacher.joinDate.split('T')[0] : '',
      });
    } else {
      setSelectedTeacher(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        employeeId: '',
        qualification: '',
        experience: 0,
        salary: 0,
        joinDate: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTeacher(null);
  };

  const handleSubmit = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    try {
      const url = selectedTeacher 
        ? `/api/users/teachers/${selectedTeacher.id}` 
        : '/api/users/teachers';
      
      const method = selectedTeacher ? 'PATCH' : 'POST';  // Changed PUT to PATCH to match the API implementation

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTeachers(pagination.current);
        handleCloseDialog();
        showSnackbar(
          selectedTeacher 
            ? t('teachers.success.teacherUpdated') 
            : t('teachers.success.teacherCreated'),
          'success'
        );
      } else {
        console.error('Failed to save teacher');
        showSnackbar(t('teachers.errors.saveFailed'));
      }
    } catch (error) {
      console.error('Error saving teacher:', error);
    }
  };

  const handleDelete = async (teacherId: string) => {
    if (window.confirm(t('teachers.confirmations.deleteSingle'))) {
      try {
        const response = await fetch(`/api/users/teachers/${teacherId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchTeachers(pagination.current);
          showSnackbar(t('teachers.success.teacherDeleted'), 'success');
        } else {
          console.error('Failed to delete teacher');
          showSnackbar(t('teachers.errors.deleteFailed'));
        }
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const handleOpenSubjectManager = (teacher: Teacher) => {
    setSubjectManagerTeacher(teacher);
    setSubjectManagerOpen(true);
  };

  const handleCloseSubjectManager = () => {
    setSubjectManagerOpen(false);
    setSubjectManagerTeacher(null);
  };

  const handleSubjectManagerUpdate = () => {
    // Refresh the teachers list to show updated subjects
    fetchTeachers(pagination.current);
  };

  const toggleTeacherStatus = async (teacherId: string, currentStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | boolean) => {
    try {
      // Handle both boolean and string status for compatibility
      let newStatus: 'ACTIVE' | 'INACTIVE';
      
      if (typeof currentStatus === 'boolean') {
        // Old way using isActive boolean
        newStatus = currentStatus ? 'INACTIVE' : 'ACTIVE';
      } else {
        // New way using status enum
        newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      }
      
      const response = await fetch(`/api/users/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTeachers(pagination.current);
        showSnackbar(t('teachers.success.statusUpdated'), 'success');
      } else {
        console.error('Failed to toggle teacher status');
        showSnackbar(t('teachers.errors.saveFailed'));
      }
    } catch (error) {
      console.error('Error toggling teacher status:', error);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    const confirmMessage = action === 'delete'
      ? t('teachers.confirmations.deleteBulk', { count: selectedIds.length })
      : action === 'activate'
      ? t('teachers.confirmations.activate', { count: selectedIds.length })
      : t('teachers.confirmations.deactivate', { count: selectedIds.length });
      
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch('/api/users/teachers', {
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
        fetchTeachers(pagination.current);
        showSnackbar(
          action === 'delete' 
            ? t('teachers.success.bulkDeleted') 
            : action === 'activate'
            ? t('teachers.success.bulkActivated')
            : t('teachers.success.bulkDeactivated'),
          'success'
        );
      } else {
        console.error(`Failed to ${action} teachers`);
        showSnackbar(t('teachers.errors.saveFailed'));
      }
    } catch (error) {
      console.error(`Error ${action} teachers:`, error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(teachers.map(teacher => teacher.id));
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

  const handleViewTeacher = (teacher: Teacher) => {
    setViewTeacher(teacher);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewTeacher(null);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, current: value }));
    fetchTeachers(value);
  };

  const handlePageSizeChange = (event: any) => {
    const newPageSize = parseInt(event.target.value);
    setPageSize(newPageSize);
    setPagination(prev => ({ ...prev, current: 1, limit: newPageSize }));
  };

  const exportToCSV = () => {
    const headers = [
      t('teachers.table.headers.teacher'),
      t('teachers.form.email'),
      t('teachers.form.phoneNumber'),
      t('teachers.table.headers.employeeId'),
      t('teachers.table.headers.subjects'),
      t('teachers.table.headers.experience'),
      t('teachers.table.headers.status'),
      t('teachers.table.headers.joined')
    ];
    const rows = teachers.map(teacher => [
      `${teacher.user.firstName} ${teacher.user.lastName}`,
      teacher.user.email,
      teacher.user.phoneNumber || t('teachers.page.notProvided'),
      teacher.employeeId,
      teacher.subjects.map(s => isRTL ? s.nameAr : s.name).join(', ') || t('teachers.page.noSubjectsAssigned'),
      `${teacher.experience} ${t('teachers.page.years')}`,
      teacher.user.status === 'ACTIVE' ? t('teachers.filters.active') : t('teachers.filters.inactive'),
      teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString(locale, dateFormatOptions) : t('teachers.page.notProvided'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <SidebarLayout>
        <Alert severity="error">
          {t('teachers.errors.noPermission')}
        </Alert>
      </SidebarLayout>
    );
  }

  // Define table columns
  const columns: Column[] = [
    {
      key: 'user.firstName',
      label: t('teachers.table.headers.teacher'),
      render: (value, row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      key: 'employeeId',
      label: t('teachers.table.headers.employeeId'),
    },
    {
      key: 'subjects',
      label: t('teachers.table.headers.subjects'),
      render: (value, row) => {
        if (!row.subjects || row.subjects.length === 0) {
          return t('teachers.page.noSubjectsAssigned');
        }
        if (row.subjects.length === 1) {
          return isRTL ? row.subjects[0].nameAr : row.subjects[0].name;
        }
        return `${isRTL ? row.subjects[0].nameAr : row.subjects[0].name} (+${row.subjects.length - 1} more)`;
      },
    },
    {
      key: 'experience',
      label: t('teachers.table.headers.experience'),
      render: (value) => `${value} ${t('teachers.page.years')}`,
    },
    {
      key: 'user.status',
      label: t('teachers.table.headers.status'),
      render: (value, row) => {
        const statusValue = value || row?.user?.status;
        return (
          <Chip
            label={statusValue === 'ACTIVE' ? t('teachers.filters.active') : t('teachers.filters.inactive')}
            color={statusValue === 'ACTIVE' ? 'success' : 'error'}
            size="small"
          />
        );
      },
    },
    {
      key: 'joinDate',
      label: t('teachers.table.headers.joined'),
      render: (value) => {
        if (!value) return t('teachers.page.notProvided');
        const date = new Date(value);
        return date.toLocaleDateString(isRTL ? 'ar' : 'en-US', {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      },
    },
  ];

  // Define table actions
  const actions: Action[] = [
    {
      key: 'view',
      label: t('teachers.actions.view'),
      icon: <Visibility />,
      onClick: (row) => handleViewTeacher(row),
    },
    {
      key: 'edit',
      label: t('teachers.actions.edit'),
      icon: <Edit />,
      onClick: (row) => handleOpenDialog(row),
    },
    {
      key: 'manageSubjects',
      label: t('teachers.actions.manageSubjects'),
      icon: <Assignment />,
      onClick: (row) => handleOpenSubjectManager(row),
    },
    {
      key: 'toggleStatus',
      label: row => row.user.status === 'ACTIVE' ? t('teachers.page.deactivate') : t('teachers.page.activate'),
      icon: row => row.user.status === 'ACTIVE' ? <Block /> : <CheckCircle />,
      onClick: (row) => toggleTeacherStatus(row.id, row.user.status),
      color: row => row.user.status === 'ACTIVE' ? 'warning' : 'success',
    },
    {
      key: 'delete',
      label: t('teachers.actions.delete'),
      icon: <Delete />,
      onClick: (row) => handleDelete(row.id),
      color: 'error',
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: 'status',
      label: t('teachers.filters.status'),
      type: 'select',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: t('teachers.filters.allStatus') },
        { value: 'active', label: t('teachers.filters.active') },
        { value: 'inactive', label: t('teachers.filters.inactive') },
      ],
    },
  ];

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'activate',
      label: t('teachers.bulkActions.activate'),
      icon: <CheckCircle />,
      onClick: () => handleBulkAction('activate'),
      color: 'success',
    },
    {
      key: 'deactivate',
      label: t('teachers.bulkActions.deactivate'),
      icon: <Block />,
      onClick: () => handleBulkAction('deactivate'),
      color: 'warning',
    },
    {
      key: 'delete',
      label: t('teachers.bulkActions.delete'),
      icon: <Delete />,
      onClick: () => handleBulkAction('delete'),
      color: 'error',
    },
  ];

  return (
    <SidebarLayout>
      <Box>
        <PageHeader
          title={t('teachers.page.title')}
          actionLabel={t('teachers.page.addNew')}
          actionIcon={<PersonAdd />}
          onAction={() => handleOpenDialog()}
        />

        <FilterPanel
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('teachers.page.searchPlaceholder')}
          filters={filters}
          onSearch={() => fetchTeachers(1)}
          onExport={exportToCSV}
          exportLabel={t('teachers.page.exportCsv')}
          bulkActions={bulkActions}
          selectedCount={selectedIds.length}
        />

        <DataTable
          columns={columns}
          data={teachers}
          actions={actions}
          loading={loading}
          emptyMessage={t('teachers.page.noTeachersFound')}
          selectable={true}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          avatarIcon={<School />}
          avatarField="user.firstName"
          subtitleField="user.email"
        />

        <PaginationControls
          current={pagination.current}
          total={pagination.total}
          limit={pageSize}
          onPageChange={(page) => {
            setPagination(prev => ({ ...prev, current: page }));
            fetchTeachers(page);
          }}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPagination(prev => ({ ...prev, current: 1, limit: newPageSize }));
          }}
        />

        {/* Add/Edit Teacher Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedTeacher ? t('teachers.dialogs.editTeacher') : t('teachers.dialogs.addTeacher')}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Box display="flex" gap={2}>
                <TextField
                  label={t('teachers.form.firstName')}
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  fullWidth
                  required
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                />
                <TextField
                  label={t('teachers.form.lastName')}
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  fullWidth
                  required
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                />
              </Box>
              <TextField
                label={t('teachers.form.email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                fullWidth
                required
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <Box display="flex" gap={2}>
                <TextField
                  label={t('teachers.form.phoneNumber')}
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  fullWidth
                  error={!!formErrors.phoneNumber}
                  helperText={formErrors.phoneNumber}
                />
                <TextField
                  label={t('teachers.form.employeeId')}
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  fullWidth
                  required
                  error={!!formErrors.employeeId}
                  helperText={formErrors.employeeId}
                />
              </Box>
              <TextField
                label={t('teachers.form.address')}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                fullWidth
                required
                multiline
                rows={2}
                error={!!formErrors.address}
                helperText={formErrors.address}
              />
              <Box display="flex" gap={2}>
                <TextField
                  label={t('teachers.form.qualification')}
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  fullWidth
                  required
                  error={!!formErrors.qualification}
                  helperText={formErrors.qualification}
                />
                <TextField
                  label={t('teachers.form.experienceYears')}
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                  fullWidth
                  required
                  error={!!formErrors.experience}
                  helperText={formErrors.experience}
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  label={t('teachers.form.salary')}
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: parseInt(e.target.value) || 0})}
                  fullWidth
                  error={!!formErrors.salary}
                  helperText={formErrors.salary}
                />
                <TextField
                  label={t('teachers.form.joinDate')}
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!!formErrors.joinDate}
                  helperText={formErrors.joinDate}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('teachers.form.cancel')}</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedTeacher ? t('teachers.form.update') : t('teachers.form.create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Teacher Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={handleCloseViewDialog} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar>
                <School />
              </Avatar>
              {t('teachers.dialogs.teacherDetails')}
            </Box>
          </DialogTitle>
          <DialogContent>
            {viewTeacher && (
              <Box display="flex" flexDirection="column" gap={3} mt={2}>
                {/* Basic Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('teachers.dialogs.basicInformation')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.form.firstName')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.firstName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.form.lastName')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.lastName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.form.email')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.email}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.table.headers.status')}
                      </Typography>
                      <Chip
                        label={viewTeacher.user.status === 'ACTIVE' ? t('teachers.filters.active') : t('teachers.filters.inactive')}
                        color={viewTeacher.user.status === 'ACTIVE' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Paper>

                {/* Professional Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('teachers.dialogs.professionalInformation')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.table.headers.employeeId')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.employeeId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.table.headers.subjects')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.subjects.length > 0 
                          ? viewTeacher.subjects.map(s => isRTL ? s.nameAr : s.name).join(', ')
                          : t('teachers.page.noSubjectsAssigned')
                        }
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.table.headers.experience')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.experience} {t('teachers.page.years')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.form.qualification')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.qualification}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.table.headers.joined')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {new Date(viewTeacher.joinDate).toLocaleDateString(locale, dateFormatOptions)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Contact Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('teachers.dialogs.contactInformation')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.form.phoneNumber')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.phoneNumber || t('teachers.page.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('teachers.form.address')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.address || t('teachers.page.notProvided')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDialog}>{t('teachers.dialogs.close')}</Button>
            <Button 
              onClick={() => {
                handleCloseViewDialog();
                if (viewTeacher) handleOpenDialog(viewTeacher);
              }}
              variant="contained"
              startIcon={<Edit />}
            >
              {t('teachers.page.edit')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Subject Manager Dialog */}
      {subjectManagerTeacher && (
        <TeacherSubjectManager
          open={subjectManagerOpen}
          onClose={handleCloseSubjectManager}
          teacherId={subjectManagerTeacher.id}
          teacherName={`${subjectManagerTeacher.user.firstName} ${subjectManagerTeacher.user.lastName}`}
          currentSubjects={subjectManagerTeacher.subjects}
          onUpdate={handleSubjectManagerUpdate}
        />
      )}
    </SidebarLayout>
  );
}
