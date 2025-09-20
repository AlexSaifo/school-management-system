'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import {
  Quiz as ExamIcon,
  Add,
  DateRange,
  Schedule,
  Person,
  Class,
  Subject,
  Grade,
  Visibility,
  Edit,
  Delete,
  Assessment,
  TrendingUp,
  School,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import SidebarLayout from '@/components/layout/SidebarLayout';

interface Exam {
  id: string;
  title: string;
  description?: string;
  examDate: string;
  duration: number;
  totalMarks: number;
  instructions?: string;
  isActive: boolean;
  subject: {
    id: string;
    name: string;
    nameAr: string;
    code: string;
  };
  classRoom: {
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
  };
  teacher: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  results?: ExamResult[];
  _count: {
    results: number;
  };
}

interface ExamResult {
  id: string;
  marksObtained: number;
  grade: string;
  remarks?: string;
  student: {
    id: string;
    rollNumber?: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface ExamStatistics {
  totalStudents: number;
  averageMarks: number;
  averagePercentage: number;
  highestMarks: number;
  lowestMarks: number;
  passedStudents: number;
  failedStudents: number;
  gradeDistribution: Record<string, number>;
}

const EXAM_TYPES = [
  { value: 'امتحان نصفي', label: 'امتحان نصفي (Midterm)' },
  { value: 'امتحان نهائي', label: 'امتحان نهائي (Final)' },
  { value: 'امتحان شهري', label: 'امتحان شهري (Monthly)' },
  { value: 'مذاكرة', label: 'مذاكرة (Quiz)' },
  { value: 'امتحان شفوي', label: 'امتحان شفوي (Oral)' },
  { value: 'امتحان عملي', label: 'امتحان عملي (Practical)' }
];

const TERMS = [
  { value: 'الفصل الأول', label: 'الفصل الأول (First Term)' },
  { value: 'الفصل الثاني', label: 'الفصل الثاني (Second Term)' }
];

export default function ExamsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  // Dialogs
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const [viewResultsOpen, setViewResultsOpen] = useState(false);
  const [gradeEntryOpen, setGradeEntryOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [statistics, setStatistics] = useState<ExamStatistics | null>(null);
  
  // Grade entry states
  const [studentsForGrading, setStudentsForGrading] = useState<any[]>([]);
  const [gradeEntryForm, setGradeEntryForm] = useState<Record<string, { marks: string; remarks: string }>>({});

  // Form data for creating exam
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    examType: '',
    term: '',
    classRoomId: '',
    subjectId: '',
    examDate: '',
    examTime: '',
    duration: 120,
    totalMarks: 100,
    instructions: ''
  });

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classRooms, setClassRooms] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadExams();
      loadSubjects();
      loadClassRooms();
    }
  }, [user]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams);
      } else {
        throw new Error('Failed to load exams');
      }
    } catch (error) {
      console.error('Error loading exams:', error);
      setError('فشل في تحميل الامتحانات');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      if (!token) {
        console.error('No auth token found for loading subjects');
        return;
      }

      const response = await fetch('/api/academic/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('Subjects API response:', data);
        }
        if (data.success && data.data) {
          setSubjects(data.data);
          if (process.env.NODE_ENV === 'development') {
            console.log('Subjects loaded:', data.data.length);
          }
        } else {
          console.error('Invalid subjects response format:', data);
        }
      } else {
        console.error('Failed to load subjects, status:', response.status);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadClassRooms = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      if (!token) {
        console.error('No auth token found for loading classrooms');
        return;
      }

      const response = await fetch('/api/academic/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('ClassRooms API response:', data);
        }
        if (data.success && data.classRooms) {
          setClassRooms(data.classRooms);
          if (process.env.NODE_ENV === 'development') {
            console.log('ClassRooms loaded:', data.classRooms.length);
          }
        } else {
          console.error('Invalid classrooms response format:', data);
        }
      } else {
        console.error('Failed to load classrooms, status:', response.status);
      }
    } catch (error) {
      console.error('Error loading class rooms:', error);
    }
  };

  const handleCreateExam = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const examDateTime = new Date(`${examForm.examDate}T${examForm.examTime || '09:00'}`);

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: examForm.title,
          description: examForm.description,
          examType: examForm.examType,
          classRoomId: examForm.classRoomId,
          subjectId: examForm.subjectId,
          examDate: examDateTime.toISOString(),
          duration: examForm.duration,
          totalMarks: examForm.totalMarks,
          instructions: examForm.instructions
        })
      });

      if (response.ok) {
        setCreateExamOpen(false);
        setExamForm({
          title: '',
          description: '',
          examType: '',
          term: '',
          classRoomId: '',
          subjectId: '',
          examDate: '',
          examTime: '',
          duration: 120,
          totalMarks: 100,
          instructions: ''
        });
        loadExams();
      } else {
        const error = await response.json();
        setError(error.error || 'فشل في إنشاء الامتحان');
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      setError('فشل في إنشاء الامتحان');
    }
  };

  const viewExamResults = async (exam: Exam) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(`/api/exams/${exam.id}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExamResults(data.results);
        setStatistics(data.statistics);
        setSelectedExam(exam);
        setViewResultsOpen(true);
      } else {
        throw new Error('Failed to load results');
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setError('فشل في تحميل النتائج');
    }
  };

  const openGradeEntry = async (exam: Exam) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      // Load students for this exam's classroom and existing results in parallel
      const [studentsResponse, resultsResponse] = await Promise.all([
        fetch(`/api/students?classRoomId=${exam.classRoom.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/exams/${exam.id}/results`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        const students = studentsData.students || [];
        setStudentsForGrading(students);
        
        // Pre-populate form with existing results
        let initialFormData: Record<string, { marks: string; remarks: string }> = {};
        
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          const existingResults = resultsData.results || [];
          
          // Create a map of existing results by student ID
          existingResults.forEach((result: any) => {
            initialFormData[result.student.id] = {
              marks: result.marksObtained.toString(),
              remarks: result.remarks || ''
            };
          });
          
          // Set statistics for display
          setStatistics(resultsData.statistics);
        }

        setGradeEntryForm(initialFormData);
        setSelectedExam(exam);
        setGradeEntryOpen(true);
      } else {
        throw new Error('Failed to load students');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setError('فشل في تحميل قائمة الطلاب');
    }
  };

  const submitGrades = async () => {
    if (!selectedExam) return;

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      // Convert form data to API format
      const results = Object.entries(gradeEntryForm)
        .filter(([_, data]) => data.marks !== '')
        .map(([studentId, data]) => ({
          studentId,
          marksObtained: parseFloat(data.marks),
          remarks: data.remarks || null
        }));

      const response = await fetch(`/api/exams/${selectedExam.id}/results`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ results })
      });

      if (response.ok) {
        const savedData = await response.json();
        setGradeEntryOpen(false);
        setGradeEntryForm({});
        setSelectedExam(null);
        setStudentsForGrading([]);
        loadExams(); // Reload to update results count
        alert(`تم حفظ ${results.length} درجة بنجاح للامتحان: ${selectedExam.title}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save grades');
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      setError('فشل في حفظ الدرجات');
    }
  };

  const filteredExams = useMemo(() => {
    if (!Array.isArray(exams)) return [];
    
    return exams.filter(exam => {
      if (!exam || !exam.subject) return false;
      
      const examTitle = exam.title || '';
      const subjectName = exam.subject.name || '';
      const subjectNameAr = exam.subject.nameAr || '';
      
      const matchesSearch = examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           subjectNameAr.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !examTypeFilter || examTitle.includes(examTypeFilter);
      const matchesSubject = !subjectFilter || exam.subject.id === subjectFilter;
      
      return matchesSearch && matchesType && matchesSubject;
    });
  }, [exams, searchTerm, examTypeFilter, subjectFilter]);

  const getExamStatusColor = (exam: Exam) => {
    const now = new Date();
    const examDate = new Date(exam.examDate);
    
    if (!exam.isActive) return 'error';
    if (examDate < now) return exam._count.results > 0 ? 'success' : 'warning';
    return 'primary';
  };

  const getExamStatusText = (exam: Exam) => {
    const now = new Date();
    const examDate = new Date(exam.examDate);
    
    if (!exam.isActive) return 'غير نشط';
    if (examDate < now) return exam._count.results > 0 ? 'تم التصحيح' : 'في انتظار التصحيح';
    return 'مجدول';
  };

  if (!user) {
    return (
      <SidebarLayout>
        <Alert severity="error">يرجى تسجيل الدخول للوصول إلى الامتحانات</Alert>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              <ExamIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              نظام الامتحانات والدرجات
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {user.role === 'STUDENT' ? 'عرض امتحاناتك ونتائجك' : 
               user.role === 'TEACHER' ? 'إدارة امتحاناتك وتسجيل النتائج' : 
               'إدارة جميع الامتحانات في النظام'}
            </Typography>
          </Box>
          
          {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateExamOpen(true)}
              size="large"
            >
              إنشاء امتحان جديد
            </Button>
          )}
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="البحث في الامتحانات"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>نوع الامتحان</InputLabel>
                  <Select
                    value={examTypeFilter}
                    label="نوع الامتحان"
                    onChange={(e) => setExamTypeFilter(e.target.value)}
                  >
                    <MenuItem value="">الكل</MenuItem>
                    {EXAM_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>المادة</InputLabel>
                  <Select
                    value={subjectFilter}
                    label="المادة"
                    onChange={(e) => setSubjectFilter(e.target.value)}
                  >
                    <MenuItem value="">جميع المواد</MenuItem>
                    {subjects?.map(subject => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.nameAr || subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>الفصل</InputLabel>
                  <Select
                    value={termFilter}
                    label="الفصل"
                    onChange={(e) => setTermFilter(e.target.value)}
                  >
                    <MenuItem value="">جميع الفصول</MenuItem>
                    {TERMS.map(term => (
                      <MenuItem key={term.value} value={term.value}>
                        {term.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box display="flex" gap={1}>
                  <Tooltip title="تحديث">
                    <IconButton onClick={loadExams}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="فلترة">
                    <IconButton>
                      <FilterList />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Content */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <LinearProgress sx={{ width: '100%' }} />
          </Box>
        ) : filteredExams.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <ExamIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                لا توجد امتحانات
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.role === 'STUDENT' ? 
                  'لا توجد امتحانات مجدولة حالياً' :
                  'لم يتم إنشاء أي امتحانات بعد. اضغط على "إنشاء امتحان جديد" للبدء!'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredExams.map((exam) => (
              <Grid item xs={12} md={6} lg={4} key={exam.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <ExamIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            {exam.title}
                          </Typography>
                          <Chip 
                            label={getExamStatusText(exam)} 
                            size="small" 
                            color={getExamStatusColor(exam) as any}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Stack spacing={1} mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Subject fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {exam.subject.nameAr || exam.subject.name} ({exam.subject.code})
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Class fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {exam.classRoom.nameAr || exam.classRoom.name}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {exam.teacher.user.firstName} {exam.teacher.user.lastName}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <DateRange fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(exam.examDate).toLocaleDateString('ar-SA')}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Schedule fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {exam.duration} دقيقة
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Grade fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {exam.totalMarks} درجة
                        </Typography>
                      </Box>
                    </Stack>

                    {exam.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mt: 1
                      }}>
                        {exam.description}
                      </Typography>
                    )}

                    {user.role !== 'STUDENT' && (
                      <Box mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          النتائج: {exam._count.results} طالب
                        </Typography>
                      </Box>
                    )}
                  </CardContent>

                  <Divider />
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => viewExamResults(exam)}
                      >
                        عرض النتائج
                      </Button>
                      {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                        <Button
                          size="small"
                          startIcon={<Grade />}
                          onClick={() => openGradeEntry(exam)}
                          variant="outlined"
                        >
                          إدخال الدرجات
                        </Button>
                      )}
                    </Box>

                    {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                      <Box display="flex" gap={1}>
                        <Tooltip title="النتائج والإحصائيات">
                          <IconButton size="small" onClick={() => viewExamResults(exam)}>
                            <Assessment fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="تعديل">
                          <IconButton size="small">
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Exam Dialog */}
        <Dialog 
          open={createExamOpen} 
          onClose={() => setCreateExamOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>إنشاء امتحان جديد</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="عنوان الامتحان"
                  value={examForm.title}
                  onChange={(e) => setExamForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>نوع الامتحان</InputLabel>
                  <Select
                    value={examForm.examType}
                    label="نوع الامتحان"
                    onChange={(e) => setExamForm(prev => ({ ...prev, examType: e.target.value }))}
                  >
                    {EXAM_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="وصف الامتحان"
                  value={examForm.description}
                  onChange={(e) => setExamForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>المادة</InputLabel>
                  <Select
                    value={examForm.subjectId}
                    label="المادة"
                    onChange={(e) => setExamForm(prev => ({ ...prev, subjectId: e.target.value }))}
                    required
                  >
                    {(subjects || []).map(subject => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.nameAr || subject.name} ({subject.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>الصف</InputLabel>
                  <Select
                    value={examForm.classRoomId}
                    label="الصف"
                    onChange={(e) => setExamForm(prev => ({ ...prev, classRoomId: e.target.value }))}
                    required
                  >
                    {(classRooms || []).map(classRoom => (
                      <MenuItem key={classRoom.id} value={classRoom.id}>
                        {classRoom.nameAr || classRoom.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="تاريخ الامتحان"
                  value={examForm.examDate}
                  onChange={(e) => setExamForm(prev => ({ ...prev, examDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="وقت الامتحان"
                  value={examForm.examTime}
                  onChange={(e) => setExamForm(prev => ({ ...prev, examTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="مدة الامتحان (دقيقة)"
                  value={examForm.duration}
                  onChange={(e) => setExamForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="الدرجة الكاملة"
                  value={examForm.totalMarks}
                  onChange={(e) => setExamForm(prev => ({ ...prev, totalMarks: parseInt(e.target.value) }))}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="تعليمات الامتحان"
                  value={examForm.instructions}
                  onChange={(e) => setExamForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="أدخل التعليمات الخاصة بالامتحان..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateExamOpen(false)}>إلغاء</Button>
            <Button 
              variant="contained" 
              onClick={handleCreateExam}
              disabled={!examForm.title || !examForm.subjectId || !examForm.classRoomId || !examForm.examDate}
            >
              إنشاء الامتحان
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Results Dialog */}
        <Dialog
          open={viewResultsOpen}
          onClose={() => setViewResultsOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {selectedExam ? `نتائج ${selectedExam.title}` : 'نتائج الامتحان'}
          </DialogTitle>
          <DialogContent>
            {statistics && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>إحصائيات الامتحان</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="primary">
                          {statistics.totalStudents}
                        </Typography>
                        <Typography variant="body2">إجمالي الطلاب</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="success.main">
                          {statistics.averagePercentage.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">المعدل العام</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="success.main">
                          {statistics.passedStudents}
                        </Typography>
                        <Typography variant="body2">ناجح</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="error.main">
                          {statistics.failedStudents}
                        </Typography>
                        <Typography variant="body2">راسب</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>الطالب</TableCell>
                    <TableCell align="center">الرقم</TableCell>
                    <TableCell align="center">الدرجة</TableCell>
                    <TableCell align="center">النسبة</TableCell>
                    <TableCell align="center">التقدير</TableCell>
                    <TableCell>ملاحظات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(examResults || []).map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        {result.student.user.firstName} {result.student.user.lastName}
                      </TableCell>
                      <TableCell align="center">
                        {result.student.rollNumber || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {result.marksObtained}/{selectedExam?.totalMarks}
                      </TableCell>
                      <TableCell align="center">
                        {selectedExam ? 
                          ((Number(result.marksObtained) / Number(selectedExam.totalMarks)) * 100).toFixed(1) 
                          : 0}%
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={result.grade} 
                          size="small"
                          color={result.grade.includes('راسب') ? 'error' : 
                                 result.grade.includes('ممتاز') ? 'success' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>{result.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewResultsOpen(false)}>إغلاق</Button>
          </DialogActions>
        </Dialog>

        {/* Grade Entry Dialog */}
        <Dialog 
          open={gradeEntryOpen} 
          onClose={() => setGradeEntryOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            إدخال درجات الامتحان: {selectedExam?.title}
            <Typography variant="subtitle2" color="text.secondary">
              الدرجة الكاملة: {selectedExam?.totalMarks} درجة
            </Typography>
            {studentsForGrading.length > 0 && (() => {
              const gradedCount = Object.keys(gradeEntryForm).filter(id => gradeEntryForm[id]?.marks !== '').length;
              const totalCount = studentsForGrading.length;
              const progress = (gradedCount / totalCount) * 100;
              return (
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="primary">
                      تم تقييم {gradedCount} من {totalCount} طلاب
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {progress.toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: progress === 100 ? 'success.main' : 'primary.main'
                      }
                    }} 
                  />
                </Box>
              );
            })()}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {studentsForGrading.length === 0 ? (
                <Typography>لا توجد طلاب مسجلون في هذا الفصل</Typography>
              ) : (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="h3">
                      قائمة الطلاب
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          // Sort ungraded students to top
                          const sorted = [...studentsForGrading].sort((a, b) => {
                            const aHasGrade = gradeEntryForm[a.id]?.marks && gradeEntryForm[a.id]?.marks !== '';
                            const bHasGrade = gradeEntryForm[b.id]?.marks && gradeEntryForm[b.id]?.marks !== '';
                            if (aHasGrade && !bHasGrade) return 1;
                            if (!aHasGrade && bHasGrade) return -1;
                            return 0;
                          });
                          setStudentsForGrading(sorted);
                        }}
                      >
                        إظهار غير المُقيّمين أولاً
                      </Button>
                    </Box>
                  </Box>
                  <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>الحالة</TableCell>
                        <TableCell>الطالب</TableCell>
                        <TableCell>الرقم</TableCell>
                        <TableCell>الدرجة المحصلة</TableCell>
                        <TableCell>ملاحظات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentsForGrading.map((student) => {
                        const hasGrade = gradeEntryForm[student.id]?.marks && gradeEntryForm[student.id]?.marks !== '';
                        return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Chip 
                              icon={hasGrade ? <TrendingUp /> : <Schedule />}
                              label={hasGrade ? 'مُقيّم' : 'معلق'}
                              size="small"
                              color={hasGrade ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {student.user.firstName} {student.user.lastName}
                          </TableCell>
                          <TableCell>
                            {student.rollNumber || '-'}
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              inputProps={{ 
                                min: 0, 
                                max: selectedExam?.totalMarks,
                                step: 0.5 
                              }}
                              value={gradeEntryForm[student.id]?.marks || ''}
                              onChange={(e) => {
                                setGradeEntryForm(prev => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id],
                                    marks: e.target.value
                                  }
                                }));
                              }}
                              placeholder={`من ${selectedExam?.totalMarks}`}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              multiline
                              rows={1}
                              value={gradeEntryForm[student.id]?.remarks || ''}
                              onChange={(e) => {
                                setGradeEntryForm(prev => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id],
                                    remarks: e.target.value
                                  }
                                }));
                              }}
                              placeholder="ملاحظات إضافية"
                            />
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGradeEntryOpen(false)}>إلغاء</Button>
            <Button 
              onClick={submitGrades}
              variant="contained"
              disabled={Object.keys(gradeEntryForm).length === 0}
            >
              حفظ الدرجات
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
