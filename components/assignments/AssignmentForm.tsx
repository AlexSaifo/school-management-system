'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close,
  Add,
  Save,
  DateRange,
  Subject,
  Class,
  Description,
  AttachFile
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from './FileUpload';

interface AttachmentFile {
  originalName: string;
  fileName: string;
  size: number;
  type: string;
  url: string;
}

interface Subject {
  id: string;
  name: string;
  nameAr: string;
  code: string;
}

interface ClassRoom {
  id: string;
  name: string;
  nameAr: string;
  section?: string;
  gradeLevel: {
    id: string;
    name: string;
    nameAr: string;
    level: number;
  };
  _count: {
    students: number;
  };
}

interface GradeLevel {
  id: string;
  name: string;
  nameAr: string;
  level: number;
  _count: {
    classRooms: number;
  };
}

interface AssignmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (assignmentData: any) => Promise<void>;
  assignment?: any; // For editing
  loading?: boolean;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  open,
  onClose,
  onSubmit,
  assignment,
  loading = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classRoomIds: [] as string[],
    gradeId: '',
    dueDate: null as Dayjs | null,
    totalMarks: '',
    instructions: '',
    attachments: [] as AttachmentFile[]
  });
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [filteredClassrooms, setFilteredClassrooms] = useState<ClassRoom[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load data on mount
  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  // Initialize form when editing
  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        subjectId: assignment.subjectId || '',
        classRoomIds: assignment.classRoomId ? [assignment.classRoomId] : [],
        gradeId: '',
        dueDate: assignment.dueDate ? dayjs(assignment.dueDate) : null,
        totalMarks: assignment.totalMarks?.toString() || '',
        instructions: assignment.instructions || '',
        attachments: assignment.attachments || []
      });
    } else {
      resetForm();
    }
  }, [assignment]);

  // Reload classrooms when subject changes
  useEffect(() => {
    if (formData.subjectId) {
      loadClassroomsBySubject(formData.subjectId);
    }
  }, [formData.subjectId]);

  // Filter classrooms by grade and subject
  useEffect(() => {
    console.log('Classrooms data:', classrooms);
    console.log('Current gradeId:', formData.gradeId);
    console.log('Current subjectId:', formData.subjectId);

    let filtered = [...classrooms];
    
    // First filter by subject if selected
    // The API already filters classrooms by teacher-subject assignments
    // This is just to ensure proper rendering when subject changes
    if (formData.subjectId) {
      console.log('Filtering for subject:', formData.subjectId);
    }
    
    // Then filter by grade if selected
    if (formData.gradeId) {
      filtered = filtered.filter(
        classroom => classroom.gradeLevel && classroom.gradeLevel.id === formData.gradeId
      );
      
      console.log('Filtered classrooms by grade:', filtered);
    }
    
    setFilteredClassrooms(filtered);
    
    // Reset classroom selection if current selection is not in filtered list
    const validClassroomIds = formData.classRoomIds.filter(id =>
      filtered.some(classroom => classroom.id === id)
    );
    if (validClassroomIds.length !== formData.classRoomIds.length) {
      setFormData(prev => ({ ...prev, classRoomIds: validClassroomIds }));
    }
    
    console.log('Final filtered classrooms:', filtered);
  }, [formData.gradeId, formData.subjectId, classrooms]);

  const loadFormData = async () => {
    setLoadingData(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      // Load subjects
      const subjectsRes = await fetch('/api/assignments/data?type=subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        console.log('Subjects API response:', subjectsData);
        setSubjects(subjectsData.subjects || []);
      } else {
        console.error('Failed to fetch subjects:', subjectsRes.status);
      }

      // Load classrooms (all available to teacher)
      await loadClassrooms();

      // Load grades
      const gradesRes = await fetch('/api/assignments/data?type=grades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        console.log('Grades API response:', gradesData);
        setGrades(gradesData.grades || []);
      } else {
        console.error('Failed to fetch grades:', gradesRes.status);
      }

    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoadingData(false);
    }
  };
  
  // Load all available classrooms
  const loadClassrooms = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
        
      // Load classrooms
      const classroomsRes = await fetch('/api/assignments/data?type=classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (classroomsRes.ok) {
        const classroomsData = await classroomsRes.json();
        console.log('Classrooms API response:', classroomsData);
        if (classroomsData.classrooms && classroomsData.classrooms.length > 0) {
          setClassrooms(classroomsData.classrooms);
        } else {
          console.warn('No classrooms returned from API or empty array');
          setClassrooms([]);
        }
      } else {
        console.error('Failed to fetch classrooms:', classroomsRes.status);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
    }
  };
  
  // Load classrooms for a specific subject
  const loadClassroomsBySubject = async (subjectId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
        
      // Load classrooms for the specific subject
      const classroomsRes = await fetch(`/api/assignments/data?type=classrooms&subjectId=${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (classroomsRes.ok) {
        const classroomsData = await classroomsRes.json();
        console.log(`Classrooms API response for subject ${subjectId}:`, classroomsData);
        if (classroomsData.classrooms && classroomsData.classrooms.length > 0) {
          setClassrooms(classroomsData.classrooms);
        } else {
          console.warn(`No classrooms returned for subject ${subjectId}`);
          setClassrooms([]);
        }
      } else {
        console.error('Failed to fetch classrooms for subject:', classroomsRes.status);
      }
    } catch (error) {
      console.error('Error loading classrooms for subject:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subjectId: '',
      classRoomIds: [],
      gradeId: '',
      dueDate: null,
      totalMarks: '',
      instructions: '',
      attachments: [] as AttachmentFile[]
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('assignments.form.titleRequired');
    }

    if (!formData.subjectId) {
      newErrors.subjectId = t('assignments.form.subjectRequired');
    }

    if (formData.classRoomIds.length === 0) {
      newErrors.classRoomIds = t('assignments.form.classroomRequired');
    }

    if (!formData.dueDate) {
      newErrors.dueDate = t('assignments.form.dueDateRequired');
    } else if (formData.dueDate.isBefore(dayjs())) {
      newErrors.dueDate = t('assignments.form.dueDatePast');
    }

    if (!formData.totalMarks || isNaN(Number(formData.totalMarks)) || Number(formData.totalMarks) <= 0) {
      newErrors.totalMarks = t('assignments.form.totalMarksInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit({
        ...formData,
        totalMarks: Number(formData.totalMarks),
        dueDate: formData.dueDate?.toISOString()
      });
      resetForm();
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleClassroomChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      classRoomIds: typeof value === 'string' ? value.split(',') : value
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {assignment 
                ? t('assignments.form.editAssignment')
                : t('assignments.form.createAssignment')
              }
            </Typography>
            <IconButton onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {loadingData ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('assignments.form.title')}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.subjectId}>
                  <InputLabel required>{t('assignments.form.subject')}</InputLabel>
                  <Select
                    value={formData.subjectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                    label={t('assignments.form.subject')}
                  >
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        <Box>
                          <Typography variant="body1">
                            {subject.nameAr || subject.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subject.code}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.subjectId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.subjectId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('assignments.form.grade')}</InputLabel>
                  <Select
                    value={formData.gradeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, gradeId: e.target.value }))}
                    label={t('assignments.form.grade')}
                  >
                    <MenuItem value="">
                      <em>{t('assignments.form.allGrades')}</em>
                    </MenuItem>
                    {grades.map((grade) => (
                      <MenuItem key={grade.id} value={grade.id}>
                        {grade.nameAr || grade.name} ({grade._count.classRooms} {t('assignments.form.classes')})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.classRoomIds}>
                  <InputLabel required>{t('assignments.form.classrooms')}</InputLabel>
                  <Select
                    multiple
                    value={formData.classRoomIds}
                    onChange={handleClassroomChange}
                    input={<OutlinedInput label={t('assignments.form.classrooms')} />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const classroom = filteredClassrooms.find(c => c.id === value);
                          return (
                            <Chip
                              key={value}
                              label={classroom ? 
                                `${classroom.nameAr || classroom.name}${classroom.section ? ` - ${classroom.section}` : ''}` 
                                : value
                              }
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {filteredClassrooms.length > 0 ? (
                      filteredClassrooms.map((classroom) => (
                        <MenuItem key={classroom.id} value={classroom.id}>
                          <Checkbox checked={formData.classRoomIds.indexOf(classroom.id) > -1} />
                          <ListItemText
                            primary={`${classroom.nameAr || classroom.name}${classroom.section ? ` - ${classroom.section}` : ''}`}
                            secondary={classroom.gradeLevel ? 
                              `${classroom.gradeLevel.nameAr || classroom.gradeLevel.name} - ${classroom._count?.students || 0} ${t('common.students')}` :
                              t('common.noGradeInfo')
                            }
                          />
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        <ListItemText primary={t('common.noClassroomsAvailable') || 'No classrooms available'} />
                      </MenuItem>
                    )}
                  </Select>
                  {errors.classRoomIds && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.classRoomIds}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label={t('assignments.form.dueDate')}
                  value={formData.dueDate}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, dueDate: newValue }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.dueDate,
                      helperText: errors.dueDate
                    }
                  }}
                  minDateTime={dayjs()}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('assignments.form.totalMarks')}
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalMarks: e.target.value }))}
                  error={!!errors.totalMarks}
                  helperText={errors.totalMarks}
                  inputProps={{ min: 1, step: 1 }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('assignments.form.description')}
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('assignments.form.instructions')}
                  multiline
                  rows={4}
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  helperText={t('assignments.form.instructionsHelper')}
                />
              </Grid>

              {/* File Attachments */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFile />
                  {t('assignments.form.attachments')}
                </Typography>
                <FileUpload
                  attachments={formData.attachments}
                  onAttachmentsChange={(attachments) => 
                    setFormData(prev => ({ ...prev, attachments }))
                  }
                  label={t('assignments.form.uploadFiles')}
                  disabled={loading || loadingData}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : assignment ? <Save /> : <Add />}
            disabled={loading || loadingData}
          >
            {assignment 
              ? t('common.update')
              : t('assignments.form.createAssignment')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AssignmentForm;