'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SidebarLayout from '@/components/layout/SidebarLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageHeader from '@/components/PageHeader';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  ArrowBack as ArrowBackIcon,
  Class as ClassIcon,
  School as SchoolIcon,
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

interface Class {
  id: string;
  name: string;
  nameAr: string;
  section: string;
  gradeLevel: {
    id: string;
    name: string;
    nameAr: string;
    level: number;
  };
  classTeacher: {
    id: string;
    name: string;
  } | null;
  studentCount: number;
}

interface TimeSlot {
  id: string;
  name: string;
  nameAr: string;
  startTime: string;
  endTime: string;
  slotOrder: number;
  slotType: string;
}

interface TimetableEntry {
  id: string;
  subject: {
    name: string;
    nameAr: string;
    code: string;
    color: string;
  } | null;
  teacher: {
    name: string;
  } | null;
  room: {
    name: string;
    nameAr: string;
  } | null;
  slotType: string;
}

interface DayTimetable {
  day: number;
  dayName: string;
  dayNameAr: string;
  slots: Array<{
    timeSlot: TimeSlot;
    entry: TimetableEntry | null;
  }>;
}

const ClassesTimetablePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [timetable, setTimetable] = useState<DayTimetable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassTimetable(selectedClass);
    }
  }, [selectedClass]);

  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading classes...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/academic/classes');
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      setError('Failed to fetch classes');
    }
  };

  const fetchClassTimetable = async (classId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/timetable/${classId}`);
      const data = await response.json();
      if (data.success) {
        setTimetable(data.data.timetable);
      }
    } catch (error) {
      setError('Failed to fetch class timetable');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Simple CSV export
    const selectedClassData = classes.find(c => c.id === selectedClass);
    if (!selectedClassData || !timetable.length) return;

    let csvContent = `الصف: ${selectedClassData.nameAr}\n\n`;
    csvContent += 'الوقت,';
    timetable.forEach(day => {
      csvContent += `${day.dayNameAr},`;
    });
    csvContent += '\n';

    if (timetable[0]?.slots) {
      timetable[0].slots.forEach((_, slotIndex) => {
        const timeSlot = timetable[0].slots[slotIndex].timeSlot;
        csvContent += `${timeSlot.nameAr} (${timeSlot.startTime}-${timeSlot.endTime}),`;
        
        timetable.forEach(day => {
          const entry = day.slots[slotIndex]?.entry;
          if (entry?.subject) {
            csvContent += `${entry.subject.nameAr} - ${entry.teacher?.name || 'بدون معلم'},`;
          } else {
            csvContent += `${entry?.slotType === 'BREAK' ? 'راحة' : 
                           entry?.slotType === 'LUNCH' ? 'غداء' : 
                           entry?.slotType === 'ASSEMBLY' ? 'طابور' : 'فارغ'},`;
          }
        });
        csvContent += '\n';
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timetable-${selectedClassData.nameAr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSlotTypeColor = (slotType: string) => {
    switch (slotType) {
      case 'LESSON': return '#4CAF50';
      case 'BREAK': return '#FF9800';
      case 'LUNCH': return '#2196F3';
      case 'ASSEMBLY': return '#9C27B0';
      case 'FREE': return '#9E9E9E';
      default: return '#607D8B';
    }
  };

  const selectedClassData = classes.find(c => c.id === selectedClass);

  return (
    <ErrorBoundary>
      <SidebarLayout>
        <Box sx={{ p: 3 }}>
          {/* Page Header */}
          <PageHeader
            title="جداول الصفوف"
            subtitle="عرض وإدارة جداول الصفوف الدراسية"
            actionLabel="العودة إلى الجدول الرئيسي"
            actionIcon={<ArrowBackIcon />}
            onAction={() => router.push('/timetable')}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Class Selection */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>اختر الصف</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    label="اختر الصف"
                  >
                    {classes.map(cls => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.gradeLevel.nameAr} - {cls.nameAr} ({cls.section}) - {cls.studentCount} طالب
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {selectedClassData && (
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h6">{selectedClassData.nameAr}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedClassData.gradeLevel.nameAr} - الشعبة {selectedClassData.section}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      عدد الطلاب: {selectedClassData.studentCount}
                    </Typography>
                    {selectedClassData.classTeacher && (
                      <Typography variant="body2" color="text.secondary">
                        معلم الصف: {selectedClassData.classTeacher.name}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
              
              {selectedClass && timetable.length > 0 && (
                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={handlePrint}
                      startIcon={<PrintIcon />}
                      size="small"
                    >
                      طباعة
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleExport}
                      startIcon={<DownloadIcon />}
                      size="small"
                    >
                      تصدير
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

      {/* Timetable Grid */}
      {timetable.length > 0 && (
        <TableContainer component={Paper} className="printable-timetable">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>الوقت</TableCell>
                {timetable.map(day => (
                  <TableCell key={day.day} sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: 150 }}>
                    <Box>
                      <Typography variant="body2">{day.dayNameAr}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {day.dayName}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {timetable[0]?.slots.map((_, slotIndex) => (
                <TableRow key={slotIndex}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {timetable[0].slots[slotIndex].timeSlot.nameAr}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {timetable[0].slots[slotIndex].timeSlot.name}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {timetable[0].slots[slotIndex].timeSlot.startTime} - {timetable[0].slots[slotIndex].timeSlot.endTime}
                      </Typography>
                    </Box>
                  </TableCell>
                  {timetable.map(day => {
                    const slotData = day.slots[slotIndex];
                    const entry = slotData?.entry;
                    
                    return (
                      <TableCell key={`${day.day}-${slotIndex}`} sx={{ p: 1 }}>
                        {entry ? (
                          <Card 
                            sx={{ 
                              minHeight: 80,
                              bgcolor: entry.subject?.color || getSlotTypeColor(entry.slotType),
                              color: 'white'
                            }}
                          >
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                              {entry.subject ? (
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                                    {entry.subject.nameAr}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {entry.subject.code}
                                  </Typography>
                                  {entry.teacher && (
                                    <Typography variant="caption" display="block">
                                      {entry.teacher.name}
                                    </Typography>
                                  )}
                                  {entry.room && (
                                    <Typography variant="caption" display="block">
                                      {entry.room.nameAr}
                                    </Typography>
                                  )}
                                </>
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {entry.slotType === 'BREAK' ? 'راحة' : 
                                   entry.slotType === 'LUNCH' ? 'غداء' : 
                                   entry.slotType === 'ASSEMBLY' ? 'طابور' : 'حرة'}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ) : (
                          <Box
                            sx={{
                              minHeight: 80,
                              border: '1px solid #e0e0e0',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: '#f5f5f5'
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              فارغ
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!selectedClass && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <ClassIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            اختر صفاً لعرض جدوله الدراسي
          </Typography>
        </Box>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-timetable,
          .printable-timetable * {
            visibility: visible;
          }
          .printable-timetable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
      `}</style>
        </Box>
      </SidebarLayout>
    </ErrorBoundary>
  );
};

export default ClassesTimetablePage;
