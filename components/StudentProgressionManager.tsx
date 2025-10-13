'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface Student {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  studentId: string;
  classRoom: {
    name: string;
    gradeLevel: {
      id: string;
      name: string;
      level: number;
    };
    academicYear: {
      id: string;
      name: string;
      nameAr?: string;
    };
  };
  academicProgressions: Array<{
    progressionType: 'PROMOTED' | 'RETAINED';
    effectiveDate: string;
  }>;
}

interface GradeLevel {
  id: string;
  name: string;
  nameAr: string;
  level: number;
}

interface AcademicYear {
  id: string;
  name: string;
  nameAr?: string;
  startDate: string;
  endDate: string;
}

interface ProgressionData {
  studentId: string;
  toGradeLevelId: string;
  toAcademicYearId: string;
  progressionType: 'PROMOTED' | 'RETAINED';
  reason?: string;
  toClassRoomId?: string;
}

interface ClassRoomOption {
  id: string;
  name: string;
  section: string;
  capacity: number;
  gradeLevelId: string;
  academicYearId: string;
  _count?: {
    students: number;
  };
}

export default function StudentProgressionManager() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState<string>('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [progressionType, setProgressionType] = useState<'PROMOTED' | 'RETAINED'>('PROMOTED');
  const [targetGradeLevelId, setTargetGradeLevelId] = useState<string>('');
  const [targetAcademicYearId, setTargetAcademicYearId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [targetClassRooms, setTargetClassRooms] = useState<ClassRoomOption[]>([]);
  const [targetClassRoomId, setTargetClassRoomId] = useState<string>('');
  const [loadingClassRooms, setLoadingClassRooms] = useState<boolean>(false);

  // Helper function to get grade name based on language
  const getGradeName = (grade: GradeLevel) => {
    return language === 'ar' ? grade.nameAr : grade.name;
  };

  // Helper function to get academic year name based on language
  const getAcademicYearName = (year: AcademicYear) => {
    return language === 'ar' && year.nameAr ? year.nameAr : year.name;
  };

  // Helper function to get action name based on language
  const getActionName = (action: string) => {
    if (action === 'promoted') {
      return language === 'ar' ? 'تم الترقية' : 'Promoted';
    } else if (action === 'retained') {
      return language === 'ar' ? 'تم الاحتفاظ' : 'Retained';
    }
    return action;
  };

  // Load initial data
  useEffect(() => {
    loadGradeLevels();
    loadAcademicYears();
  }, []);

  // Load students when grade and academic year are selected
  useEffect(() => {
    if (selectedGradeLevelId && selectedAcademicYearId) {
      loadStudents();
    }
  }, [selectedGradeLevelId, selectedAcademicYearId]);

  useEffect(() => {
    if (progressionType === 'PROMOTED' && targetGradeLevelId && targetAcademicYearId) {
      loadTargetClassRooms(targetGradeLevelId, targetAcademicYearId);
    } else {
      setTargetClassRooms([]);
      setTargetClassRoomId('');
    }
  }, [progressionType, targetGradeLevelId, targetAcademicYearId]);

  const loadGradeLevels = async () => {
    try {
      // Get auth token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      const response = await fetch('/api/academic/grade-levels', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response structures
        const levels = data.gradeLevels || data.data || [];
        
        setGradeLevels(levels);
      } else {
        console.error('Failed to load grade levels:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading grade levels:', error);
      showSnackbar(t('studentProgression.errorLoadingGrades'), 'error');
    }
  };

  const loadAcademicYears = async () => {
    try {
      // Get auth token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      const response = await fetch('/api/academic/academic-years', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response structures
        const years = data.data || data.academicYears || [];
        
        setAcademicYears(years);
        // Set the most recent academic year as default
        if (years && years.length > 0) {
          const sortedYears = years.sort((a: AcademicYear, b: AcademicYear) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          setSelectedAcademicYearId(sortedYears[0].id);
        }
      } else {
        console.error('Failed to load academic years:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
      showSnackbar(t('studentProgression.errorLoadingYears'), 'error');
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Get auth token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      const response = await fetch(
        `/api/students/progression?gradeLevelId=${selectedGradeLevelId}&academicYearId=${selectedAcademicYearId}`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setSelectedStudents(new Set());
        setTargetClassRooms([]);
        setTargetClassRoomId('');

        // Set default target academic year (next year)
        if (data.nextAcademicYear) {
          setTargetAcademicYearId(data.nextAcademicYear.id);
        }

        if (progressionType === 'PROMOTED' && data.availableGrades) {
          const currentLevel = data.currentGrade?.level ?? null;
          const nextGrade = data.availableGrades.find((grade: GradeLevel) =>
            currentLevel !== null ? grade.level > currentLevel : true
          );

          setTargetGradeLevelId(nextGrade ? nextGrade.id : '');
        }
      } else {
        showSnackbar(t('studentProgression.errorLoadingStudents'), 'error');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      showSnackbar(t('studentProgression.errorLoadingStudents'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTargetClassRooms = async (gradeId: string, yearId: string) => {
    setLoadingClassRooms(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(
        `/api/academic/classrooms?gradeLevelId=${gradeId}&academicYearId=${yearId}&onlyActive=true`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load classrooms');
      }

      const data = await response.json();
      const classrooms: ClassRoomOption[] = data.classRooms || [];
      setTargetClassRooms(classrooms);

      const availableClassroom = classrooms.find((classroom) => {
        const enrolled = classroom._count?.students ?? 0;
        return enrolled < classroom.capacity;
      });

      setTargetClassRoomId(availableClassroom ? availableClassroom.id : '');

      if (!availableClassroom && classrooms.length > 0) {
        showSnackbar(t('studentProgression.errorNoClassroomAvailable'), 'warning');
      }

      if (classrooms.length === 0) {
        showSnackbar(t('studentProgression.noClassroomsForSelection'), 'warning');
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
      showSnackbar(t('studentProgression.errorLoadingClassrooms'), 'error');
      setTargetClassRooms([]);
      setTargetClassRoomId('');
    } finally {
      setLoadingClassRooms(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleProgressStudents = async () => {
    if (selectedStudents.size === 0) {
      showSnackbar(t('studentProgression.selectAtLeastOneStudent'), 'warning');
      return;
    }

    if (!targetGradeLevelId || !targetAcademicYearId) {
      showSnackbar(t('studentProgression.selectTargetGradeAndYear'), 'warning');
      return;
    }

    if (progressionType === 'PROMOTED' && !targetClassRoomId) {
      showSnackbar(t('studentProgression.selectTargetClassroom'), 'warning');
      return;
    }

    setConfirmDialogOpen(true);
  };

  const confirmProgression = async () => {
    setProcessing(true);
    try {
      const progressions: ProgressionData[] = Array.from(selectedStudents).map(studentId => ({
        studentId,
        toGradeLevelId: targetGradeLevelId,
        toAcademicYearId: targetAcademicYearId,
        progressionType,
        reason: reason.trim() || undefined,
        toClassRoomId: progressionType === 'PROMOTED' ? targetClassRoomId : undefined,
      }));

      // Get auth token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      const response = await fetch('/api/students/progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ progressions }),
      });

      if (response.ok) {
        const data = await response.json();
        const successCount = data.results.filter((r: any) => r.success).length;
        const totalCount = data.results.length;
        const failedResults = data.results.filter((r: any) => !r.success);

        // Show success message
        showSnackbar(
          language === 'ar' 
            ? `تم معالجة ${successCount} من أصل ${totalCount} طالب بنجاح`
            : `Successfully processed ${successCount} out of ${totalCount} students`,
          successCount === totalCount ? 'success' : 'warning'
        );

        // Show error messages for failed progressions
        if (failedResults.length > 0) {
          failedResults.forEach((result: any) => {
            setTimeout(() => {
              // Check if it's a known error and translate it
              let errorMessage = result.error;
              if (result.error.includes('No available classroom found')) {
                errorMessage = t('studentProgression.errorNoClassroomAvailable');
              }
              
              showSnackbar(
                language === 'ar'
                  ? `خطأ في معالجة الطالب: ${errorMessage}`
                  : `Error processing student: ${errorMessage}`,
                'error'
              );
            }, 1000); // Small delay to show after success message
          });
        }

        // Reload students to reflect changes
        loadStudents();
        setConfirmDialogOpen(false);
        setSelectedStudents(new Set());
        setReason('');
      } else {
        const error = await response.json();
        showSnackbar(error.error || t('studentProgression.errorProcessingStudents'), 'error');
      }
    } catch (error) {
      console.error('Error processing students:', error);
      showSnackbar(t('studentProgression.errorProcessingStudents'), 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getProgressionStatus = (student: Student) => {
    const latestProgression = student.academicProgressions[0];
    if (!latestProgression) return null;

    return {
      type: latestProgression.progressionType,
      date: new Date(latestProgression.effectiveDate).toLocaleDateString(),
    };
  };

  const selectedTargetClassroom = targetClassRooms.find((room) => room.id === targetClassRoomId) || null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('studentProgression.title')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('studentProgression.selectGradeAndYear')}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('studentProgression.gradeLevel')}</InputLabel>
              <Select
                value={selectedGradeLevelId}
                onChange={(e) => setSelectedGradeLevelId(e.target.value)}
                label={t('studentProgression.gradeLevel')}
              >
                {gradeLevels.map((grade) => (
                  <MenuItem key={grade.id} value={grade.id}>
                    {getGradeName(grade)} (Level {grade.level})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('studentProgression.academicYear')}</InputLabel>
              <Select
                value={selectedAcademicYearId}
                onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                label={t('studentProgression.academicYear')}
              >
                {academicYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {getAcademicYearName(year)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              onClick={loadStudents}
              disabled={!selectedGradeLevelId || !selectedAcademicYearId || loading}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : t('studentProgression.loadStudents')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {students.length > 0 && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('studentProgression.progressionSettings')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('studentProgression.action')}</InputLabel>
                  <Select
                    value={progressionType}
                    onChange={(e) => setProgressionType(e.target.value as 'PROMOTED' | 'RETAINED')}
                    label={t('studentProgression.action')}
                  >
                    <MenuItem value="PROMOTED">{t('studentProgression.promoteToNextGrade')}</MenuItem>
                    <MenuItem value="RETAINED">{t('studentProgression.retainInSameGrade')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('studentProgression.targetAcademicYear')}</InputLabel>
                  <Select
                    value={targetAcademicYearId}
                    onChange={(e) => setTargetAcademicYearId(e.target.value)}
                    label={t('studentProgression.targetAcademicYear')}
                  >
                    {academicYears.map((year) => (
                      <MenuItem key={year.id} value={year.id}>
                        {getAcademicYearName(year)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {progressionType === 'PROMOTED' && (
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>{t('studentProgression.targetGradeLevel')}</InputLabel>
                    <Select
                      value={targetGradeLevelId}
                      onChange={(e) => setTargetGradeLevelId(e.target.value)}
                      label={t('studentProgression.targetGradeLevel')}
                    >
                      {gradeLevels.map((grade) => (
                        <MenuItem key={grade.id} value={grade.id}>
                          {getGradeName(grade)} (Level {grade.level})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {progressionType === 'PROMOTED' && (
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>{t('studentProgression.targetClassroom')}</InputLabel>
                    <Select
                      value={targetClassRoomId}
                      onChange={(e) => setTargetClassRoomId(e.target.value)}
                      label={t('studentProgression.targetClassroom')}
                      displayEmpty
                      renderValue={(value) => {
                        if (!value) {
                          return loadingClassRooms
                            ? t('common.loading')
                            : t('studentProgression.selectClassroomPlaceholder');
                        }
                        const selected = targetClassRooms.find((room) => room.id === value);
                        if (!selected) {
                          return t('studentProgression.selectClassroomPlaceholder');
                        }
                        const enrolled = selected._count?.students ?? 0;
                        return `${selected.name} (${enrolled}/${selected.capacity})`;
                      }}
                    >
                      {loadingClassRooms && (
                        <MenuItem value="" disabled>
                          {t('common.loading')}
                        </MenuItem>
                      )}
                      {!loadingClassRooms && targetClassRooms.length === 0 && (
                        <MenuItem value="" disabled>
                          {t('studentProgression.noClassroomsForSelection')}
                        </MenuItem>
                      )}
                      {!loadingClassRooms &&
                        targetClassRooms.map((classroom) => {
                          const enrolled = classroom._count?.students ?? 0;
                          const isFull = enrolled >= classroom.capacity;
                          return (
                            <MenuItem key={classroom.id} value={classroom.id} disabled={isFull}>
                              {`${classroom.name} (${enrolled}/${classroom.capacity})`}
                              {isFull && ` • ${t('studentProgression.classroomFull')}`}
                            </MenuItem>
                          );
                        })}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label={t('studentProgression.reason')}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('studentProgression.reasonPlaceholder')}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleProgressStudents}
                disabled={
                  selectedStudents.size === 0 ||
                  !targetAcademicYearId ||
                  (progressionType === 'PROMOTED' && (!targetGradeLevelId || !targetClassRoomId))
                }
              >
                {language === 'ar' 
                  ? `معالجة ${selectedStudents.size} طالب(ين) مختار(ين)` 
                  : `Process ${selectedStudents.size} Selected Student(s)`
                }
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {(() => {
                const gradeId = students[0]?.classRoom?.gradeLevel?.id;
                const yearId = students[0]?.classRoom?.academicYear?.id;
                
                const gradeName = gradeId && gradeLevels.find(g => g.id === gradeId) 
                  ? getGradeName(gradeLevels.find(g => g.id === gradeId)!) 
                  : students[0]?.classRoom?.gradeLevel?.name || '';
                
                const yearName = yearId && academicYears.find(y => y.id === yearId)
                  ? getAcademicYearName(academicYears.find(y => y.id === yearId)!)
                  : students[0]?.classRoom?.academicYear?.name || '';
                
                console.log('Grade name:', gradeName, 'Year name:', yearName);
                console.log('Translation test:', t('studentProgression.title'));
                
                return `${language === 'ar' ? 'الطلاب في' : 'Students in'} ${gradeName} - ${yearName}`;
              })()}
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedStudents.size === students.length && students.length > 0}
                        indeterminate={selectedStudents.size > 0 && selectedStudents.size < students.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>{t('studentProgression.studentId')}</TableCell>
                    <TableCell>{t('studentProgression.studentName')}</TableCell>
                    <TableCell>{t('studentProgression.currentClass')}</TableCell>
                    <TableCell>{t('studentProgression.lastProgression')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const progressionStatus = getProgressionStatus(student);
                    return (
                      <TableRow key={student.id}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>
                          {student.user.firstName} {student.user.lastName}
                        </TableCell>
                        <TableCell>{student.classRoom.name}</TableCell>
                        <TableCell>
                          {progressionStatus ? (
                            <Chip
                              label={`${progressionStatus.type === 'PROMOTED' ? t('studentProgression.promoted') : t('studentProgression.retained')} (${progressionStatus.date})`}
                              color={progressionStatus.type === 'PROMOTED' ? 'success' : 'warning'}
                              size="small"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {t('studentProgression.noProgressionHistory')}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {students.length === 0 && selectedGradeLevelId && selectedAcademicYearId && !loading && (
        <Alert severity="info">
          {t('studentProgression.noStudentsFound')}
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>{t('studentProgression.confirmProgression')}</DialogTitle>
        <DialogContent>
          <Typography>
            {language === 'ar' 
              ? `هل أنت متأكد من أنك تريد ${getActionName(progressionType.toLowerCase())} ${selectedStudents.size} طالب(ين)؟ لا يمكن التراجع عن هذا الإجراء.`
              : `Are you sure you want to ${getActionName(progressionType.toLowerCase())} ${selectedStudents.size} student(s)? This action cannot be undone.`
            }
          </Typography>
          {progressionType === 'PROMOTED' && (
            <Typography sx={{ mt: 1 }}>
              {t('studentProgression.promoteToNextGrade')} {gradeLevels.find(g => g.id === targetGradeLevelId) ? getGradeName(gradeLevels.find(g => g.id === targetGradeLevelId)!) : ''} {t('studentProgression.targetAcademicYear').toLowerCase()} {academicYears.find(y => y.id === targetAcademicYearId) ? getAcademicYearName(academicYears.find(y => y.id === targetAcademicYearId)!) : ''}.
            </Typography>
          )}
          {progressionType === 'PROMOTED' && selectedTargetClassroom && (
            <Typography sx={{ mt: 1 }}>
              {t('studentProgression.targetClassroom')}: {selectedTargetClassroom.name} (
              {(selectedTargetClassroom._count?.students ?? 0)}/{selectedTargetClassroom.capacity}
              )
            </Typography>
          )}
          {progressionType === 'RETAINED' && (
            <Typography sx={{ mt: 1 }}>
              {t('studentProgression.retainInSameGrade')} {academicYears.find(y => y.id === targetAcademicYearId) ? getAcademicYearName(academicYears.find(y => y.id === targetAcademicYearId)!) : ''}.
            </Typography>
          )}
          {reason && (
            <Typography sx={{ mt: 1 }}>
              {t('studentProgression.reason')}: {reason}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={confirmProgression}
            variant="contained"
            color="primary"
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}