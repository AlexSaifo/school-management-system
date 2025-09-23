'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/layout/SidebarLayout';

interface GradeLevel {
  id: string;
  name: string;
  nameAr: string;
  level: number;
  description?: string;
  isActive: boolean;
  classRooms: Array<{
    id: string;
    name: string;
    section: string;
    teacher?: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
    _count: {
      students: number;
    };
  }>;
  totalClasses: number;
  totalStudents: number;
}

export default function GradeManagementPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    level: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchGradeLevels();
  }, []);

  const fetchGradeLevels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/academic/grade-levels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grade levels');
      }

      const data = await response.json();
      setGradeLevels(data.gradeLevels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch grade levels');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (grade?: GradeLevel) => {
    if (grade) {
      setEditingGrade(grade);
      setFormData({
        name: grade.name,
        nameAr: grade.nameAr,
        level: grade.level.toString(),
        description: grade.description || '',
        isActive: grade.isActive
      });
    } else {
      setEditingGrade(null);
      setFormData({
        name: '',
        nameAr: '',
        level: '',
        description: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGrade(null);
    setFormData({
      name: '',
      nameAr: '',
      level: '',
      description: '',
      isActive: true
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth_token');
      const url = editingGrade 
        ? `/api/academic/grade-levels/${editingGrade.id}`
        : '/api/academic/grade-levels';
      
      const method = editingGrade ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          level: parseInt(formData.level)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save grade level');
      }

      await fetchGradeLevels();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grade level');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (gradeId: string) => {
    if (!confirm(t('academic.grades.confirmDelete'))) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/academic/grade-levels/${gradeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete grade level');
      }

      await fetchGradeLevels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete grade level');
    }
  };

  const getTotalStudents = (classRooms: GradeLevel['classRooms']) => {
    if (!classRooms || !Array.isArray(classRooms)) {
      return 0;
    }
    return classRooms.reduce((total, cls) => total + (cls._count?.students || 0), 0);
  };

  if (loading) {
    return (
      <SidebarLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            {t('academic.grades.title')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('academic.grades.addGrade')}
          </Button>
        </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SchoolIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {gradeLevels.length}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('academic.grades.totalGrades')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ClassIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {gradeLevels.reduce((total, grade) => total + (grade.classRooms?.length || 0), 0)}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('academic.grades.totalClasses')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {gradeLevels.reduce((total, grade) => total + getTotalStudents(grade.classRooms), 0)}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('academic.grades.totalStudents')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SchoolIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {gradeLevels.filter(grade => grade.isActive).length}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('academic.grades.activeGrades')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grade Levels Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            {t('academic.grades.gradeList')}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('academic.grades.level')}</TableCell>
                  <TableCell>{t('academic.grades.name')}</TableCell>
                  <TableCell>{t('academic.grades.nameAr')}</TableCell>
                  <TableCell>{t('academic.grades.classes')}</TableCell>
                  <TableCell>{t('academic.grades.students')}</TableCell>
                  <TableCell>{t('academic.grades.status')}</TableCell>
                  <TableCell align="center">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gradeLevels.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>
                      <Chip 
                        label={grade.level} 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>{grade.name}</TableCell>
                    <TableCell>{grade.nameAr}</TableCell>
                    <TableCell>{grade.classRooms?.length || 0}</TableCell>
                    <TableCell>{getTotalStudents(grade.classRooms)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={grade.isActive ? t('common.active') : t('common.inactive')} 
                        color={grade.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.edit')}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(grade)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(grade.id)}
                          disabled={(grade.classRooms?.length || 0) > 0}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGrade ? t('academic.grades.editGrade') : t('academic.grades.addGrade')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('academic.grades.level')}
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label={t('academic.grades.isActive')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('academic.grades.name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('academic.grades.nameAr')}
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                required
                dir="rtl"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('academic.grades.description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !formData.name || !formData.level}
          >
            {submitting ? <CircularProgress size={20} /> : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </SidebarLayout>
  );
}
