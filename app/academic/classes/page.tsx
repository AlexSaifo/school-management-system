'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  IconButton,
  Stack,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fab,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Class, 
  Add, 
  Edit, 
  Delete, 
  People, 
  Person,
  ArrowBack,
  School,
  Grade
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import SidebarLayout from '@/components/layout/SidebarLayout';

interface ClassRoom {
  id: string;
  name: string;
  nameAr: string;
  section: string;
  sectionNumber: number;
  roomNumber: string;
  floor: number | null;
  capacity: number | null;
  facilities: string[];
  isActive: boolean;
  academicYear: string;
  gradeLevel: {
    id: string;
    level: string;
    levelAr: string;
  };
  _count: {
    students: number;
  };
}

interface GradeLevel {
  id: string;
  level: string;
  levelAr: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    section: '',
    sectionNumber: 1,
    gradeLevelId: '',
    roomNumber: '',
    floor: 1,
    capacity: 30,
    facilities: [] as string[],
    academicYear: '2024-2025'
  });

  useEffect(() => {
    fetchClassRooms();
    fetchGradeLevels();
  }, []);

  const fetchClassRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/');
        return;
      }
      
      const response = await fetch('/api/academic/classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token invalid, redirecting to login');
          localStorage.removeItem('token');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch classrooms');
      }

      const data = await response.json();
      setClassRooms(data.classRooms || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      setError('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchGradeLevels = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found for grade levels');
        return;
      }
      
      const response = await fetch('/api/academic/grade-levels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token invalid for grade levels');
          localStorage.removeItem('token');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch grade levels');
      }

      const data = await response.json();
      setGradeLevels(data.gradeLevels || []);
    } catch (error) {
      console.error('Error fetching grade levels:', error);
    }
  };

  const handleAddClass = () => {
    setSelectedClass(null);
    setFormData({
      name: '',
      nameAr: '',
      section: '',
      sectionNumber: 1,
      gradeLevelId: '',
      roomNumber: '',
      floor: 1,
      capacity: 30,
      facilities: [],
      academicYear: '2024-2025'
    });
    setOpenDialog(true);
  };

  const handleEditClass = (classData: ClassRoom) => {
    setSelectedClass(classData);
    setFormData({
      name: classData.name,
      nameAr: classData.nameAr,
      section: classData.section,
      sectionNumber: classData.sectionNumber,
      gradeLevelId: classData.gradeLevel.id,
      roomNumber: classData.roomNumber,
      floor: classData.floor || 1,
      capacity: classData.capacity || 30,
      facilities: classData.facilities,
      academicYear: classData.academicYear
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClass(null);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedClass 
        ? `/api/academic/classrooms/${selectedClass.id}`
        : '/api/academic/classrooms';
      
      const method = selectedClass ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save classroom');
      }

      await fetchClassRooms();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving classroom:', error);
      setError('Failed to save classroom');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/academic/classrooms/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete classroom');
      }

      await fetchClassRooms();
    } catch (error) {
      console.error('Error deleting classroom:', error);
      setError('Failed to delete classroom');
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => router.push('/academic')} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Class sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  {t('academic.classManagement')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('academic.manageClassesDescription')}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddClass}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                px: 3,
                py: 1.5
              }}
            >
              {t('academic.addClass')}
            </Button>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Classes Overview Cards */}
          <Grid container spacing={3}>
            {classRooms.map((classRoom) => (
              <Grid item xs={12} md={6} lg={4} key={classRoom.id}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #1976d215 0%, #1976d205 100%)',
                    border: '2px solid #1976d220',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                      border: '2px solid #1976d2',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Class Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            background: 'linear-gradient(135deg, #1976d2 0%, #1976d2CC 100%)',
                          }}
                        >
                          <Grade />
                        </Avatar>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditClass(classRoom)}
                            sx={{ color: '#1976d2' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(classRoom.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Class Info */}
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {isRTL ? classRoom.nameAr : classRoom.name}
                        </Typography>
                        <Stack direction="row" spacing={1} mb={1}>
                          <Chip 
                            label={isRTL ? classRoom.gradeLevel.levelAr : classRoom.gradeLevel.level} 
                            size="small" 
                            sx={{ 
                              background: '#1976d2',
                              color: 'white',
                              fontSize: '0.75rem'
                            }} 
                          />
                          <Chip 
                            label={`${t('academic.section')} ${classRoom.section}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: '#1976d2',
                              color: '#1976d2',
                              fontSize: '0.75rem'
                            }} 
                          />
                        </Stack>
                      </Box>

                      {/* Stats */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {classRoom._count.students}/{classRoom.capacity || 30} {t('academic.students')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {classRoom.academicYear}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Room */}
                      <Typography variant="body2" color="text.secondary">
                        <strong>{t('academic.room')}:</strong> {classRoom.roomNumber}
                        {classRoom.floor && ` (Floor ${classRoom.floor})`}
                      </Typography>

                      {/* Facilities */}
                      {classRoom.facilities && classRoom.facilities.length > 0 && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            {t('academic.facilities')}:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {classRoom.facilities.slice(0, 3).map((facility, index) => (
                              <Chip 
                                key={index}
                                label={facility} 
                                size="small" 
                                variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                          {classRoom.facilities.length > 3 && (
                            <Chip 
                              label={`+${classRoom.facilities.length - 3}`} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Classes Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School />
                {t('academic.detailedView')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('academic.className')}</TableCell>
                      <TableCell>{t('academic.level')}</TableCell>
                      <TableCell>{t('academic.students')}</TableCell>
                      <TableCell>{t('academic.room')}</TableCell>
                      <TableCell>{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classRooms.map((classRoom) => (
                      <TableRow key={classRoom.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar 
                              sx={{ 
                                width: 30, 
                                height: 30, 
                                background: '#1976d2',
                                fontSize: '0.8rem'
                              }}
                            >
                              {classRoom.section}
                            </Avatar>
                            {isRTL ? classRoom.nameAr : classRoom.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={isRTL ? classRoom.gradeLevel.levelAr : classRoom.gradeLevel.level} 
                            size="small" 
                            sx={{ 
                              background: '#1976d220',
                              color: '#1976d2'
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <People sx={{ fontSize: 16 }} />
                            {classRoom._count.students}/{classRoom.capacity || 30}
                          </Box>
                        </TableCell>
                        <TableCell>{classRoom.roomNumber}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditClass(classRoom)}
                              sx={{ color: 'primary.main' }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDelete(classRoom.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>

        {/* Add/Edit Class Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedClass ? t('academic.editClass') : t('academic.addClass')}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.className')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.classNameArabic')}
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('academic.level')}</InputLabel>
                    <Select 
                      value={formData.gradeLevelId}
                      onChange={(e) => setFormData({ ...formData, gradeLevelId: e.target.value })}
                    >
                      {gradeLevels.map((grade) => (
                        <MenuItem key={grade.id} value={grade.id}>
                          {isRTL ? grade.levelAr : grade.level}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.section')}
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.capacity')}
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.roomNumber')}
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.floor')}
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.academicYear')}
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
              }}
            >
              {selectedClass ? t('common.update') : t('common.add')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
