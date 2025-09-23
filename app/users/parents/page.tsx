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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PersonAdd,
  FamilyRestroom,
  Search,
  GetApp,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import ParentStudentRelationManager from '@/components/ParentStudentRelationManager';
import DataTable, { Column, Action } from '@/components/DataTable';
import FilterPanel, { Filter, FilterOption, BulkAction } from '@/components/FilterPanel';
import PageHeader from '@/components/PageHeader';
import PaginationControls from '@/components/PaginationControls';
import CryptoJS from 'crypto-js';

// AES encryption utilities
const SECRET_KEY = process.env.NEXT_PUBLIC_AES_SECRET_KEY || 'your-secret-key-here';

const decryptPassword = (encryptedPassword: string): string => {
  if (encryptedPassword.startsWith('$2a$') || encryptedPassword.startsWith('$2b$') || encryptedPassword.startsWith('$2y$')) {
    // Legacy bcrypt hash - return placeholder since we can't decrypt
    return '••••••••';
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return '••••••••';
  }
};

interface Parent {
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
  emergencyContact: string;
  children: Array<{
    id: string;
    studentId: string;
    grade: string;
    gradeAr?: string;
    section: string;
    relationship?: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

export default function ParentsPage() {
  const { user, token } = useAuth();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();
  const locale = isRTL ? 'ar' : 'en-US'; // Use 'ar' instead of 'ar-SA' to avoid Hijri calendar as default
  // Define date format options to force Gregorian calendar
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric", 
    month: "long", 
    day: "numeric"
    // Removed calendar: "gregory" to prevent hydration mismatches
  };
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewParent, setViewParent] = useState<Parent | null>(null);
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
    emergencyContact: '',
    password: '',
    confirmPassword: '',
  });

  // State for student relations with relationship types
  const [studentRelations, setStudentRelations] = useState<Array<{
    studentId: string;
    relationship: string;
  }>>([]);

  useEffect(() => {
    if (token) {
      fetchParents(1);
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [token, searchTerm, statusFilter, pageSize]);

  const fetchParents = async (page = pagination.current) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      const response = await fetch(`/api/users/parents?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const response_data = await response.json();
        setParents(response_data.data?.parents || []);
        setPagination(response_data.data?.pagination || {
          current: 1,
          total: 0,
          count: 0,
          limit: pageSize,
        });
      } else {
        console.error('Failed to fetch parents');
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (parent?: Parent) => {
    if (parent) {
      setSelectedParent(parent);
      setFormData({
        firstName: parent.user.firstName,
        lastName: parent.user.lastName,
        email: parent.user.email,
        phoneNumber: parent.user.phoneNumber || '',
        address: parent.user.address || '',
        emergencyContact: parent.emergencyContact,
        password: '', // Don't populate password for security
        confirmPassword: '', // Don't populate confirm password
      });
      // Initialize student relations from existing children
      setStudentRelations(parent.children?.map(child => ({
        studentId: child.id,
        relationship: 'Father' // Default relationship
      })) || []);
    } else {
      setSelectedParent(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        emergencyContact: '',
        password: '',
        confirmPassword: '',
      });
      setStudentRelations([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedParent(null);
    setStudentRelations([]); // Clear student relations to prevent API calls
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Password validation (only for new parents or when admin is changing password)
    if (!selectedParent) {
      if (!formData.password.trim()) {
        alert('Password is required for new parents');
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
    }

    try {
      const url = selectedParent 
        ? `/api/users/parents/${selectedParent.id}` 
        : '/api/users/parents';
      
      const method = selectedParent ? 'PATCH' : 'POST';  // Changed PUT to PATCH to match the API implementation

      // Prepare request data
      const requestData = { ...formData };
      
      // Remove confirmPassword as it's not needed in the API
      delete (requestData as any).confirmPassword;
      
      // For updates, only include password if it's provided
      if (selectedParent && !requestData.password.trim()) {
        delete (requestData as any).password;
      }

      const finalRequestData = {
        ...requestData,
        studentRelations: studentRelations, // Include selected student relations with types
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(finalRequestData),
      });

      if (response.ok) {
        fetchParents(pagination.current);
        handleCloseDialog();
      } else {
        console.error('Failed to save parent');
      }
    } catch (error) {
      console.error('Error saving parent:', error);
    }
  };

  const handleDelete = async (parentId: string) => {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      try {
        const response = await fetch(`/api/users/parents/${parentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchParents(pagination.current);
        } else {
          console.error('Failed to delete parent');
        }
      } catch (error) {
        console.error('Error deleting parent:', error);
      }
    }
  };

  const toggleParentStatus = async (parentId: string, currentStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | boolean) => {
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
      
      const response = await fetch(`/api/users/parents/${parentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchParents(pagination.current);
      } else {
        console.error('Failed to toggle parent status');
      }
    } catch (error) {
      console.error('Error toggling parent status:', error);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedIds.length} parent(s)?`
      : `Are you sure you want to ${action} ${selectedIds.length} parent(s)?`;
      
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch('/api/users/parents', {
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
        fetchParents(pagination.current);
      } else {
        console.error(`Failed to ${action} parents`);
      }
    } catch (error) {
      console.error(`Error ${action} parents:`, error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(parents.map(parent => parent.id));
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

  const handleViewParent = (parent: Parent) => {
    setViewParent(parent);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewParent(null);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, current: value }));
    fetchParents(value);
  };

  const handlePageSizeChange = (event: any) => {
    const newPageSize = parseInt(event.target.value);
    setPageSize(newPageSize);
    setPagination(prev => ({ ...prev, current: 1, limit: newPageSize }));
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Children Count', 'Status', 'Registered'];
    const rows = parents.map(parent => [
      `${parent.user.firstName} ${parent.user.lastName}`,
      parent.user.email,
      parent.user.phoneNumber || 'N/A',
      parent.children?.length || 0,
      parent.user.status === 'ACTIVE' ? 'Active' : 'Inactive',
      new Date(parent.user.createdAt).toLocaleDateString(locale, dateFormatOptions),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parents_${new Date().toISOString().split('T')[0]}.csv`;
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
      label: t('parents.parent'),
      render: (value, row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      key: 'password',
      label: t('parents.password'),
      render: (value, row) => {
        // Only show password for admins
        if (user?.role !== 'ADMIN') {
          return '••••••••';
        }
        // Decrypt and show the actual password
        const encryptedPassword = row.user?.password || '';
        if (!encryptedPassword) return 'Not set';
        return decryptPassword(encryptedPassword);
      },
    },
    {
      key: 'children',
      label: t('parents.children'),
      render: (value: any, row: any) => {
        if (row.children && row.children.length > 0) {
          return row.children.map((child: Parent['children'][0]) => 
            `${child.user.firstName} ${child.user.lastName} (${child.grade || ''} ${child.section || ''})`
          ).join(', ');
        }
        return t('parents.noChildren');
      },
    },
    {
      key: 'emergencyContact',
      label: t('parents.emergencyContact'),
    },
    {
      key: 'user.status',
      label: t('parents.status'),
    },
    {
      key: 'user.createdAt',
      label: t('parents.joined'),
      render: (value) => new Date(value).toLocaleDateString(locale, dateFormatOptions),
    },
  ];

  // Define table actions
  const actions: Action[] = [
    {
      key: 'view',
      label: t('common.viewDetails'),
      icon: <Visibility />,
      onClick: (row) => handleViewParent(row),
    },
    {
      key: 'edit',
      label: t('parents.editParent'),
      icon: <Edit />,
      onClick: (row) => handleOpenDialog(row),
    },
    {
      key: 'toggleStatus',
      label: row => row.user.status === 'ACTIVE' ? t('common.deactivate') : t('common.activate'),
      icon: row => row.user.status === 'ACTIVE' ? <Block /> : <CheckCircle />,
      onClick: (row) => toggleParentStatus(row.id, row.user.status),
      color: row => row.user.status === 'ACTIVE' ? 'warning' : 'success',
    },
    {
      key: 'delete',
      label: t('common.delete'),
      icon: <Delete />,
      onClick: (row) => handleDelete(row.id),
      color: 'error',
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: 'status',
      label: t('parents.statusLabel'),
      type: 'select',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: t('parents.allStatus') },
        { value: 'active', label: t('parents.active') },
        { value: 'inactive', label: t('parents.inactive') },
      ],
    },
  ];

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'activate',
      label: t('parents.activate'),
      icon: <CheckCircle />,
      onClick: () => handleBulkAction('activate'),
      color: 'success',
    },
    {
      key: 'deactivate',
      label: t('parents.deactivate'),
      icon: <Block />,
      onClick: () => handleBulkAction('deactivate'),
      color: 'warning',
    },
    {
      key: 'delete',
      label: t('parents.delete'),
      icon: <Delete />,
      onClick: () => handleBulkAction('delete'),
      color: 'error',
    },
  ];

  return (
    <SidebarLayout>
      <Box>
        <PageHeader
          title={t('parents.title')}
          actionLabel={t('parents.addNew')}
          actionIcon={<PersonAdd />}
          onAction={() => handleOpenDialog()}
        />

        <FilterPanel
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('parents.searchPlaceholder')}
          filters={filters}
          onSearch={() => fetchParents(1)}
          onExport={exportToCSV}
          exportLabel={t('parents.exportCSV')}
          bulkActions={bulkActions}
          selectedCount={selectedIds.length}
        />

        <DataTable
          columns={columns}
          data={parents}
          actions={actions}
          loading={loading}
          emptyMessage={t('parents.noParentsFound')}
          selectable={true}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          avatarIcon={<FamilyRestroom />}
          avatarField="user.firstName"
          subtitleField="user.email"
        />

        <PaginationControls
          current={pagination.current}
          total={pagination.total}
          limit={pageSize}
          onPageChange={(page) => {
            setPagination(prev => ({ ...prev, current: page }));
            fetchParents(page);
          }}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPagination(prev => ({ ...prev, current: 1, limit: newPageSize }));
          }}
        />

        {/* Add/Edit Parent Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedParent ? t('parents.editParent') : t('parents.addNew')}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Box display="flex" gap={2}>
                <TextField
                  label={t('parents.firstName')}
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  fullWidth
                  required
                />
                <TextField
                  label={t('parents.lastName')}
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label={t('parents.email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                fullWidth
                required
              />
              {!selectedParent && (
                <>
                  <TextField
                    label={t('parents.password')}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    fullWidth
                    required={!selectedParent}
                  />
                  <TextField
                    label={t('parents.confirmPassword')}
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    fullWidth
                    required={!selectedParent}
                  />
                </>
              )}
              {selectedParent && user?.role === 'ADMIN' && (
                <TextField
                  label={t('parents.password')}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  fullWidth
                  placeholder="Leave empty to keep current password"
                />
              )}
              <Box display="flex" gap={2}>
                <TextField
                  label={t('parents.phoneNumber')}
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  fullWidth
                  required
                />
                <TextField
                  label={t('parents.emergencyContact')}
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label={t('parents.address')}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                fullWidth
                multiline
                rows={2}
              />

              {/* Student Relations Management */}
              <Box mt={3}>
                <Typography variant="h6" color="primary" gutterBottom>
                  {t('parents.associatedStudents')}
                </Typography>

                <ParentStudentRelationManager
                  mode="parent"
                  currentId={selectedParent?.id}
                  selectedRelations={studentRelations}
                  onRelationsChange={(relations: Array<{
                    parentId?: string;
                    studentId?: string;
                    relationship: string;
                  }>) => {
                    const convertedRelations = relations
                      .filter(rel => rel.studentId) // Filter out relations without studentId
                      .map(rel => ({
                        studentId: rel.studentId!,
                        relationship: rel.relationship
                      }));
                    setStudentRelations(convertedRelations);
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedParent ? t('common.update') : t('common.create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Parent Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={handleCloseViewDialog} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar>
                <FamilyRestroom />
              </Avatar>
              {t('parents.parentDetails')}
            </Box>
          </DialogTitle>
          <DialogContent>
            {viewParent && (
              <Box display="flex" flexDirection="column" gap={3} mt={2}>
                {/* Basic Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('parents.basicInformation')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('parents.firstName')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewParent.user.firstName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('parents.lastName')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewParent.user.lastName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('parents.email')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewParent.user.email}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('parents.status')}
                      </Typography>
                      <Chip
                        label={viewParent.user.status === 'ACTIVE' ? t('parents.active') : t('parents.inactive')}
                        color={viewParent.user.status === 'ACTIVE' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Paper>

                {/* Contact Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('parents.contactInformation')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('parents.phoneNumber')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewParent.user.phoneNumber || t('common.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('parents.emergencyContact')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewParent.emergencyContact}
                      </Typography>
                    </Box>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('parents.address')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewParent.user.address || t('common.notProvided')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Children Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('parents.children')} ({viewParent.children?.length || 0})
                  </Typography>
                  {viewParent.children && viewParent.children.length > 0 ? (
                    <List>
                      {viewParent.children.map((child, index) => (
                        <ListItem 
                          key={child.id}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemText
                            primary={`${child.user?.firstName || 'Unknown'} ${child.user?.lastName || 'Student'}`}
                            secondary={
                              <Box>
                                <Typography variant="body2" component="span">
                                  {t('students.studentId')}: {child.studentId}
                                </Typography>
                                <br />
                                <Typography variant="body2" component="span">
                                  {t('students.grade')}: {language === 'ar' && child.gradeAr ? child.gradeAr : child.grade} | {t('students.section')}: {child.section}
                                </Typography>
                                {child.relationship && (
                                  <>
                                    <br />
                                    <Typography variant="body2" component="span">
                                      {t('users.relationship')}: {t(`users.relationships.${child.relationship}`, { defaultValue: child.relationship })}
                                    </Typography>
                                  </>
                                )}
                                <br />
                                <Typography variant="body2" component="span">
                                  {t('users.email')}: {child.user?.email || 'N/A'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t('parents.noChildrenRegistered')}
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDialog}>{t('common.close')}</Button>
            <Button 
              onClick={() => {
                handleCloseViewDialog();
                if (viewParent) handleOpenDialog(viewParent);
              }}
              variant="contained"
              startIcon={<Edit />}
            >
              {t('parents.editParent')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
