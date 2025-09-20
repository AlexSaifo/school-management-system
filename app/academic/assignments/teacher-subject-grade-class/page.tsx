'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';
import SidebarLayout from '@/components/layout/SidebarLayout';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Card,
  CardContent,
  Button
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Subject as SubjectIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface Subject {
  id: string;
  name: string;
  nameAr: string;
  code: string;
}

interface Grade {
  id: string;
  name: string;
  level: number;
}

interface Classroom {
  id: string;
  name: string;
  room: {
    name: string;
    capacity: number;
  };
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
  isActive: boolean;
  createdAt: string;
  subject: Subject;
  classRoom: {
    id: string;
    name: string;
    roomNumber: string;
    capacity: number;
    gradeLevel: Grade;
  };
  _count: {
    submissions: number;
  };
}

interface TeacherSubjectData {
  subject: Subject;
  grades: Grade[];
  classrooms: Classroom[];
  assignments: Assignment[];
}

export default function TeacherSubjectGradeClassPage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherSubjectData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      redirect('/auth/login');
    }
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'TEACHER') {
      redirect('/dashboard');
    }
  }, [user?.role]);

  useEffect(() => {
    fetchTeacherData();
  }, [token]);

  const fetchTeacherData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('/api/teachers/subject-assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher assignment data');
      }

      const data = await response.json();
      setTeacherData(data);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setError(t('assignments.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (!teacherData) return [];

    return teacherData.filter(subjectData => {
      if (selectedSubject !== 'all' && subjectData.subject.id !== selectedSubject) {
        return false;
      }

      // Filter assignments based on grade and classroom
      const filteredAssignments = subjectData.assignments.filter(assignment => {
        if (selectedGrade !== 'all' && assignment.classRoom.gradeLevel.id !== selectedGrade) {
          return false;
        }
        if (selectedClassroom !== 'all' && assignment.classRoom.id !== selectedClassroom) {
          return false;
        }
        return true;
      });

      // Include subject data if it has matching assignments or if no filters are applied
      return filteredAssignments.length > 0 || (selectedGrade === 'all' && selectedClassroom === 'all');
    }).map(subjectData => ({
      ...subjectData,
      assignments: subjectData.assignments.filter(assignment => {
        if (selectedGrade !== 'all' && assignment.classRoom.gradeLevel.id !== selectedGrade) {
          return false;
        }
        if (selectedClassroom !== 'all' && assignment.classRoom.id !== selectedClassroom) {
          return false;
        }
        return true;
      })
    }));
  };

  const getAllGrades = () => {
    const grades = new Map<string, Grade>();
    teacherData.forEach(subjectData => {
      subjectData.grades.forEach(grade => {
        grades.set(grade.id, grade);
      });
    });
    return Array.from(grades.values()).sort((a, b) => a.level - b.level);
  };

  const getAllClassrooms = () => {
    const classrooms = new Map<string, Classroom>();
    teacherData.forEach(subjectData => {
      subjectData.classrooms.forEach(classroom => {
        classrooms.set(classroom.id, classroom);
      });
    });
    return Array.from(classrooms.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  if (!user) {
    return <CircularProgress />;
  }

  return (
    <SidebarLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssignmentIcon />
          {t('assignments.teacherSubjectManagement')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {t('assignments.manageAssignmentsBySubjectGradeClass')}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('common.filters')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>{t('assignments.subject')}</InputLabel>
                    <Select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      label={t('assignments.subject')}
                    >
                      <MenuItem value="all">{t('common.all')}</MenuItem>
                      {teacherData.map(subjectData => (
                        <MenuItem key={subjectData.subject.id} value={subjectData.subject.id}>
                          {subjectData.subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>{t('academic.grade')}</InputLabel>
                    <Select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      label={t('academic.grade')}
                    >
                      <MenuItem value="all">{t('common.all')}</MenuItem>
                      {getAllGrades().map(grade => (
                        <MenuItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>{t('academic.classroom')}</InputLabel>
                    <Select
                      value={selectedClassroom}
                      onChange={(e) => setSelectedClassroom(e.target.value)}
                      label={t('academic.classroom')}
                    >
                      <MenuItem value="all">{t('common.all')}</MenuItem>
                      {getAllClassrooms().map(classroom => (
                        <MenuItem key={classroom.id} value={classroom.id}>
                          {classroom.name} ({classroom.room.name})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Results */}
            <Grid container spacing={3}>
              {getFilteredData().map(subjectData => (
                <Grid item xs={12} key={subjectData.subject.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <SubjectIcon color="primary" />
                        <Typography variant="h5">
                          {subjectData.subject.name}
                        </Typography>
                        <Chip label={subjectData.subject.code} variant="outlined" />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('assignments.totalAssignments')}: {subjectData.assignments.length}
                      </Typography>

                      {subjectData.assignments.length === 0 ? (
                        <Alert severity="info">
                          {t('assignments.noAssignmentsForFilters')}
                        </Alert>
                      ) : (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {subjectData.assignments.map(assignment => (
                            <Grid item xs={12} md={6} lg={4} key={assignment.id}>
                              <Paper
                                sx={{
                                  p: 2,
                                  border: 1,
                                  borderColor: 'grey.200',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    boxShadow: 2
                                  }
                                }}
                              >
                                <Typography variant="h6" gutterBottom>
                                  {assignment.title}
                                </Typography>
                                <Stack spacing={1}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SchoolIcon fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {assignment.classRoom.gradeLevel.name}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ClassIcon fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {assignment.classRoom.name}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {t('assignments.dueDate')}: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {t('assignments.submissions')}: {assignment._count.submissions}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {t('assignments.totalMarks')}: {assignment.totalMarks}
                                  </Typography>
                                </Stack>
                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    href={`/assignments/${assignment.id}`}
                                  >
                                    {t('common.view')}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="text"
                                    href={`/assignments/${assignment.id}/submissions`}
                                  >
                                    {t('assignments.submissions')}
                                  </Button>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              {getFilteredData().length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    {t('assignments.noSubjectsFound')}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Box>
    </SidebarLayout>
  );
}
