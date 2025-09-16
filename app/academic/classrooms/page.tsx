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
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layout/SidebarLayout';

interface GradeLevel {
  id: string;
  name: string;
  nameAr: string;
  level: number;
}

interface ClassRoom {
  id: string;
  name: string;
  nameAr: string;
  section: string;
  sectionNumber: number;
  roomNumber: string;
  floor: number;
  capacity: number;
  facilities: string[];
  isActive: boolean;
  academicYear: string;
  gradeLevel: GradeLevel;
  students?: { id: string }[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`classroom-tabpanel-${index}`}
      aria-labelledby={`classroom-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ClassRoomManagementPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === 'ar';
  
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClassRoom, setEditingClassRoom] = useState<ClassRoom | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [filterGradeLevel, setFilterGradeLevel] = useState('');

  // Form state
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
    isActive: true
  });

  const facilityOptions = [
    { value: 'WHITEBOARD', label: 'academic.classrooms.facilities.whiteboard' },
    { value: 'PROJECTOR', label: 'academic.classrooms.facilities.projector' },
    { value: 'AC', label: 'academic.classrooms.facilities.ac' },
    { value: 'WIFI', label: 'academic.classrooms.facilities.wifi' },
    { value: 'COMPUTER', label: 'academic.classrooms.facilities.computer' },
    { value: 'SOUND_SYSTEM', label: 'academic.classrooms.facilities.soundSystem' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch classrooms and grade levels
      const [classRoomsRes, gradeLevelsRes] = await Promise.all([
        fetch('/api/academic/classrooms', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/academic/grade-levels', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!classRoomsRes.ok || !gradeLevelsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [classRoomsData, gradeLevelsData] = await Promise.all([
        classRoomsRes.json(),
        gradeLevelsRes.json()
      ]);

      setClassRooms(classRoomsData.classRooms || []);
      setGradeLevels(gradeLevelsData.gradeLevels || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (classRoom?: ClassRoom) => {
    if (classRoom) {
      setEditingClassRoom(classRoom);
      setFormData({
        name: classRoom.name,
        nameAr: classRoom.nameAr,
        section: classRoom.section,
        sectionNumber: classRoom.sectionNumber,
        gradeLevelId: classRoom.gradeLevel.id,
        roomNumber: classRoom.roomNumber,
        floor: classRoom.floor,
        capacity: classRoom.capacity,
        facilities: classRoom.facilities,
        isActive: classRoom.isActive
      });
    } else {
      setEditingClassRoom(null);
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
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClassRoom(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const url = editingClassRoom 
        ? `/api/academic/classrooms/${editingClassRoom.id}`
        : '/api/academic/classrooms';
      
      const method = editingClassRoom ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          academicYear: '2024-2025'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save classroom');
      }

      await fetchData();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save classroom');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (classRoomId: string) => {
    if (!confirm(t('academic.classrooms.confirmDelete'))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/academic/classrooms/${classRoomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete classroom');
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete classroom');
    }
  };

  const handleFacilityToggle = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const getFilteredClassRooms = () => {
    return classRooms.filter(classRoom => {
      if (filterGradeLevel && classRoom.gradeLevel.id !== filterGradeLevel) return false;
      return true;
    });
  };

  const getClassRoomsByGrade = () => {
    const classRoomsByGrade: { [key: string]: ClassRoom[] } = {};
    classRooms.forEach(classRoom => {
      const gradeKey = classRoom.gradeLevel.nameAr;
      if (!classRoomsByGrade[gradeKey]) {
        classRoomsByGrade[gradeKey] = [];
      }
      classRoomsByGrade[gradeKey].push(classRoom);
    });
    return classRoomsByGrade;
  };

  const filteredClassRooms = getFilteredClassRooms();
  const classRoomsByGrade = getClassRoomsByGrade();

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
        {/* Header with Back Button */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton 
              onClick={() => router.back()} 
              sx={{ mr: 1 }}
              aria-label={t('common.back')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              {t('academic.classrooms.title')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('academic.classrooms.addClassroom')}
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
                      {classRooms.length}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('academic.classrooms.totalClassrooms')}
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
                  <CheckCircleIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {classRooms.filter(cr => cr.isActive).length}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('academic.classrooms.activeClassrooms')}
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
                  <GroupIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {classRooms.reduce((total, cr) => total + cr.capacity, 0)}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('academic.classrooms.totalCapacity')}
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
                  <LocationIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {gradeLevels.length}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('academic.classrooms.totalGrades')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label={t('academic.classrooms.allClassrooms')} />
              <Tab label={t('academic.classrooms.byGrade')} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {/* Filters */}
            <Box display="flex" gap={2} mb={3}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{t('academic.classrooms.filterByGrade')}</InputLabel>
                <Select
                  value={filterGradeLevel}
                  label={t('academic.classrooms.filterByGrade')}
                  onChange={(e) => setFilterGradeLevel(e.target.value)}
                >
                  <MenuItem value="">{t('common.all')}</MenuItem>
                  {gradeLevels.map(grade => (
                    <MenuItem key={grade.id} value={grade.id}>
                      {isRTL ? grade.nameAr : grade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* ClassRooms Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('academic.classrooms.roomNumber')}</TableCell>
                    <TableCell>{t('academic.classrooms.name')}</TableCell>
                    <TableCell>{t('academic.classrooms.gradeLevel')}</TableCell>
                    <TableCell>{t('academic.classrooms.section')}</TableCell>
                    <TableCell>{t('academic.classrooms.floor')}</TableCell>
                    <TableCell>{t('academic.classrooms.capacity')}</TableCell>
                    <TableCell>{t('academic.classrooms.status')}</TableCell>
                    <TableCell>{t('academic.classrooms.students')}</TableCell>
                    <TableCell align="center">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClassRooms.map((classRoom) => (
                    <TableRow key={classRoom.id}>
                      <TableCell>
                        <Chip 
                          label={classRoom.roomNumber} 
                          color="primary" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{classRoom.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {classRoom.nameAr}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={isRTL ? classRoom.gradeLevel.nameAr : classRoom.gradeLevel.name}
                          size="small"
                          color="secondary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={classRoom.section}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{t('academic.classrooms.floor')} {classRoom.floor}</TableCell>
                      <TableCell>{classRoom.capacity}</TableCell>
                      <TableCell>
                        <Chip 
                          label={classRoom.isActive ? t('common.active') : t('common.inactive')} 
                          color={classRoom.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{classRoom.students?.length || 0}</TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(classRoom)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(classRoom.id)}
                            disabled={(classRoom.students?.length ?? 0) > 0}
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
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {Object.entries(classRoomsByGrade).map(([gradeName, classRooms]) => (
                <Grid item xs={12} md={6} key={gradeName}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {gradeName} ({classRooms.length} {t('academic.classrooms.sections')})
                      </Typography>
                      <List dense>
                        {classRooms.map((classRoom) => (
                          <ListItem key={classRoom.id}>
                            <ListItemIcon>
                              {classRoom.isActive ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                            </ListItemIcon>
                            <ListItemText
                              primary={`${t('academic.classrooms.room')} ${classRoom.roomNumber} - ${classRoom.section}`}
                              secondary={`${t('academic.classrooms.floor')} ${classRoom.floor} | ${t('academic.classrooms.capacity')}: ${classRoom.capacity}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingClassRoom ? t('academic.classrooms.editClassroom') : t('academic.classrooms.addClassroom')}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('academic.classrooms.gradeLevel')}</InputLabel>
                  <Select
                    value={formData.gradeLevelId}
                    label={t('academic.classrooms.gradeLevel')}
                    onChange={(e) => setFormData({ ...formData, gradeLevelId: e.target.value })}
                  >
                    {gradeLevels.map(grade => (
                      <MenuItem key={grade.id} value={grade.id}>
                        {isRTL ? grade.nameAr : grade.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('academic.classrooms.section')}
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  required
                  placeholder="أولى، ثانية، ثالثة..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('academic.classrooms.roomNumber')}
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('academic.classrooms.capacity')}
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('academic.classrooms.floor')}
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
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
                  label={t('academic.classrooms.isActive')}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('academic.classrooms.facilitiesList')}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {facilityOptions.map((facility) => (
                    <Chip
                      key={facility.value}
                      label={t(facility.label)}
                      clickable
                      color={formData.facilities.includes(facility.value) ? 'primary' : 'default'}
                      onClick={() => handleFacilityToggle(facility.value)}
                    />
                  ))}
                </Box>
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
              disabled={submitting || !formData.gradeLevelId || !formData.section || !formData.roomNumber}
            >
              {submitting ? <CircularProgress size={20} /> : t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
