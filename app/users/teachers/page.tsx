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
} from '@mui/icons-material';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import DataTable, { Column, Action } from '@/components/DataTable';
import FilterPanel, { Filter, FilterOption, BulkAction } from '@/components/FilterPanel';
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
  department: string;
  subject: string;
  qualification: string;
  experience: number;
  salary?: number;
  joinDate: string;
}

export default function TeachersPage() {
  const { user, token } = useAuth();
  const { isRTL, language } = useLanguage();
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
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);
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
    department: '',
    subject: '',
    qualification: '',
    experience: 0,
    salary: 0,
    joinDate: '',
  });

  const departments = [
    'Mathematics',
    'Science',
    'English',
    'History',
    'Geography',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Physical Education',
    'Art',
    'Music',
  ];

  useEffect(() => {
    if (token) {
      fetchTeachers(1);
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [token, searchTerm, statusFilter, departmentFilter, pageSize]);

  const fetchTeachers = async (page = pagination.current) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);
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
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setSelectedTeacher(teacher);
      setFormData({
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        phoneNumber: teacher.user.phoneNumber || '',
        address: teacher.user.address || '',
        employeeId: teacher.employeeId,
        department: teacher.department,
        subject: teacher.subject,
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
        department: '',
        subject: '',
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
      } else {
        console.error('Failed to save teacher');
      }
    } catch (error) {
      console.error('Error saving teacher:', error);
    }
  };

  const handleDelete = async (teacherId: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const response = await fetch(`/api/users/teachers/${teacherId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchTeachers(pagination.current);
        } else {
          console.error('Failed to delete teacher');
        }
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
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
      } else {
        console.error('Failed to toggle teacher status');
      }
    } catch (error) {
      console.error('Error toggling teacher status:', error);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedIds.length} teacher(s)?`
      : `Are you sure you want to ${action} ${selectedIds.length} teacher(s)?`;
      
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
      } else {
        console.error(`Failed to ${action} teachers`);
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
    const headers = ['Name', 'Email', 'Phone', 'Employee ID', 'Department', 'Subject', 'Experience', 'Status', 'Joined'];
    const rows = teachers.map(teacher => [
      `${teacher.user.firstName} ${teacher.user.lastName}`,
      teacher.user.email,
      teacher.user.phoneNumber || 'N/A',
      teacher.employeeId,
      teacher.department,
      teacher.subject,
      `${teacher.experience} years`,
      teacher.user.status === 'ACTIVE' ? 'Active' : 'Inactive',
      new Date(teacher.user.createdAt).toLocaleDateString(locale, dateFormatOptions),
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
          You don't have permission to access this page.
        </Alert>
      </SidebarLayout>
    );
  }

  // Define table columns
  const columns: Column[] = [
    {
      key: 'user.firstName',
      label: 'Teacher',
      render: (value, row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      key: 'employeeId',
      label: 'Employee ID',
    },
    {
      key: 'department',
      label: 'Department',
    },
    {
      key: 'subject',
      label: 'Subject',
    },
    {
      key: 'experience',
      label: 'Experience',
      render: (value) => `${value} years`,
    },
    {
      key: 'user.status',
      label: 'Status',
    },
    {
      key: 'user.createdAt',
      label: 'Joined',
      render: (value) => new Date(value).toLocaleDateString(locale, dateFormatOptions),
    },
  ];

  // Define table actions
  const actions: Action[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <Visibility />,
      onClick: (row) => handleViewTeacher(row),
    },
    {
      key: 'edit',
      label: 'Edit Teacher',
      icon: <Edit />,
      onClick: (row) => handleOpenDialog(row),
    },
    {
      key: 'toggleStatus',
      label: row => row.user.status === 'ACTIVE' ? 'Deactivate' : 'Activate',
      icon: row => row.user.status === 'ACTIVE' ? <Block /> : <CheckCircle />,
      onClick: (row) => toggleTeacherStatus(row.id, row.user.status),
      color: row => row.user.status === 'ACTIVE' ? 'warning' : 'success',
    },
    {
      key: 'delete',
      label: 'Delete',
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
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      value: departmentFilter,
      onChange: setDepartmentFilter,
      options: [
        { value: 'all', label: 'All Departments' },
        ...departments.map((dept) => ({
          value: dept,
          label: dept,
        })),
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
        <PageHeader
          title="Teacher Management"
          actionLabel="Add New Teacher"
          actionIcon={<PersonAdd />}
          onAction={() => handleOpenDialog()}
        />

        <FilterPanel
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search teachers..."
          filters={filters}
          onSearch={() => fetchTeachers(1)}
          onExport={exportToCSV}
          exportLabel="Export CSV"
          bulkActions={bulkActions}
          selectedCount={selectedIds.length}
        />

        <DataTable
          columns={columns}
          data={teachers}
          actions={actions}
          loading={loading}
          emptyMessage="No teachers found"
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
            {selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Box display="flex" gap={2}>
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  fullWidth
                  required
                />
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                fullWidth
                required
              />
              <Box display="flex" gap={2}>
                <TextField
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  fullWidth
                />
                <TextField
                  label="Employee ID"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                fullWidth
                multiline
                rows={2}
              />
              <Box display="flex" gap={2}>
                <TextField
                  label="Department"
                  select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  fullWidth
                  required
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  fullWidth
                  required
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  label="Qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  fullWidth
                  required
                />
                <TextField
                  label="Experience (Years)"
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                  fullWidth
                  required
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  label="Salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: parseInt(e.target.value) || 0})}
                  fullWidth
                />
                <TextField
                  label="Join Date"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedTeacher ? 'Update' : 'Create'}
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
              Teacher Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {viewTeacher && (
              <Box display="flex" flexDirection="column" gap={3} mt={2}>
                {/* Basic Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Basic Information
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        First Name
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.firstName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Last Name
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.lastName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email Address
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.email}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={viewTeacher.user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        color={viewTeacher.user.status === 'ACTIVE' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Paper>

                {/* Professional Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Professional Information
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Employee ID
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.employeeId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.department}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Subject
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.subject}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Experience
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.experience} years
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Qualification
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.qualification}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Join Date
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
                    Contact Information
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.phoneNumber || 'Not provided'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewTeacher.user.address || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDialog}>Close</Button>
            <Button 
              onClick={() => {
                handleCloseViewDialog();
                if (viewTeacher) handleOpenDialog(viewTeacher);
              }}
              variant="contained"
              startIcon={<Edit />}
            >
              Edit Teacher
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
