'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimeSlot {
  id: string;
  name: string;
  nameAr: string;
  startTime: string;
  endTime: string;
  slotOrder: number;
  slotType: string;
  duration: number;
}

interface Subject {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  color: string;
  teachers: Array<{
    id: string;
    employeeId: string;
    name: string;
  }>;
}

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

interface Room {
  id: string;
  name: string;
  nameAr: string;
  number: string;
  type: string;
  floor: number;
  capacity: number;
}

interface TimetableEntry {
  id?: string;
  subject: Subject | null;
  teacher: {
    id: string;
    name: string;
  } | null;
  room: {
    id: string;
    name: string;
    nameAr: string;
  } | null;
  slotType: string;
  notes: string | null;
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

const TimetableManager: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  // State management
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [timetable, setTimetable] = useState<DayTimetable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<{[key: string]: any[]}>({});
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState(false);
  const [editTimeSlotMode, setEditTimeSlotMode] = useState<'add' | 'edit'>('add');
  const [currentTimeSlot, setCurrentTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    dayOfWeek: number;
    timeSlotId: string;
    entry: TimetableEntry | null;
  } | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: '',
    roomId: '',
    slotType: 'LESSON',
    notes: ''
  });

  // Time slot form states
  const [timeSlotFormData, setTimeSlotFormData] = useState({
    name: '',
    nameAr: '',
    startTime: '',
    endTime: '',
    slotType: 'LESSON',
    duration: 40
  });
  
  const [tabValue, setTabValue] = useState(0);

  // Fetch data on component mount
  useEffect(() => {
    fetchClasses();
    fetchTimeSlots();
    fetchRooms();
  }, []);

  // Fetch subjects when grade is selected
  useEffect(() => {
    if (selectedGrade) {
      fetchSubjects(selectedGrade);
    }
  }, [selectedGrade]);

  // Fetch timetable when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchTimetable(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/academic/classes');
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      setError(t('timetable.failedToFetchClasses'));
    }
  };

  const fetchSubjects = async (gradeLevel: string) => {
    try {
      const response = await fetch(`/api/timetable/subjects?gradeLevel=${gradeLevel}`);
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (error) {
      setError(t('timetable.failedToFetchSubjects'));
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch('/api/timetable/time-slots');
      const data = await response.json();
      if (data.success) {
        setTimeSlots(data.data);
      }
    } catch (error) {
      setError(t('timetable.failedToFetchTimeSlots'));
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/timetable/rooms');
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      setError(t('timetable.failedToFetchRooms'));
    }
  };

  const fetchTimetable = async (classId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/timetable/${classId}`);
      const data = await response.json();
      if (data.success) {
        setTimetable(data.data.timetable);
      }
    } catch (error) {
      setError(t('timetable.failedToFetchTimetable'));
    } finally {
      setLoading(false);
    }
  };

  // Time Slot Management Functions
  const handleAddTimeSlot = () => {
    setEditTimeSlotMode('add');
    setCurrentTimeSlot(null);
    setTimeSlotFormData({
      name: '',
      nameAr: '',
      startTime: '',
      endTime: '',
      slotType: 'LESSON',
      duration: 40
    });
    setTimeSlotDialogOpen(true);
  };

  const handleEditTimeSlot = (timeSlot: TimeSlot) => {
    setEditTimeSlotMode('edit');
    setCurrentTimeSlot(timeSlot);
    setTimeSlotFormData({
      name: timeSlot.name,
      nameAr: timeSlot.nameAr,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      slotType: timeSlot.slotType,
      duration: timeSlot.duration
    });
    setTimeSlotDialogOpen(true);
  };

  const handleDeleteTimeSlot = async (timeSlotId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الوقت؟ سيتم حذف جميع الحصص المرتبطة به.')) {
      return;
    }

    try {
      const response = await fetch(`/api/timetable/time-slots/${timeSlotId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('تم حذف الوقت بنجاح');
        fetchTimeSlots();
        if (selectedClass) {
          fetchTimetable(selectedClass);
        }
      } else {
        setError('فشل في حذف الوقت');
      }
    } catch (error) {
      setError('حدث خطأ أثناء حذف الوقت');
    }
  };

  const handleSaveTimeSlot = async () => {
    try {
      const url = editTimeSlotMode === 'add' 
        ? '/api/timetable/time-slots'
        : `/api/timetable/time-slots/${currentTimeSlot?.id}`;
      
      const method = editTimeSlotMode === 'add' ? 'POST' : 'PUT';

      // Calculate duration if not provided
      const startTime = new Date(`2024-01-01T${timeSlotFormData.startTime}`);
      const endTime = new Date(`2024-01-01T${timeSlotFormData.endTime}`);
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // in minutes

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...timeSlotFormData,
          duration: duration > 0 ? duration : timeSlotFormData.duration,
          slotOrder: editTimeSlotMode === 'add' 
            ? timeSlots.length + 1 
            : currentTimeSlot?.slotOrder
        })
      });

      if (response.ok) {
        setSuccess(`تم ${editTimeSlotMode === 'add' ? 'إضافة' : 'تحديث'} الوقت بنجاح`);
        setTimeSlotDialogOpen(false);
        fetchTimeSlots();
        if (selectedClass) {
          fetchTimetable(selectedClass);
        }
      } else {
        setError(`فشل في ${editTimeSlotMode === 'add' ? 'إضافة' : 'تحديث'} الوقت`);
      }
    } catch (error) {
      setError('حدث خطأ أثناء حفظ الوقت');
    }
  };

  // Conflict Detection Functions
  const checkTeacherConflicts = async (teacherId: string, dayOfWeek: number, timeSlotId: string, excludeClassId?: string) => {
    try {
      const response = await fetch(`/api/timetable/conflicts/teacher?teacherId=${teacherId}&dayOfWeek=${dayOfWeek}&timeSlotId=${timeSlotId}${excludeClassId ? `&excludeClassId=${excludeClassId}` : ''}`);
      const data = await response.json();
      return data.conflicts || [];
    } catch (error) {
      console.error('Error checking teacher conflicts:', error);
      return [];
    }
  };

  const checkRoomConflicts = async (roomId: string, dayOfWeek: number, timeSlotId: string, excludeClassId?: string) => {
    try {
      const response = await fetch(`/api/timetable/conflicts/room?roomId=${roomId}&dayOfWeek=${dayOfWeek}&timeSlotId=${timeSlotId}${excludeClassId ? `&excludeClassId=${excludeClassId}` : ''}`);
      const data = await response.json();
      return data.conflicts || [];
    } catch (error) {
      console.error('Error checking room conflicts:', error);
      return [];
    }
  };

  const validateTimetableEntry = async (entry: {
    teacherId: string;
    roomId: string;
    dayOfWeek: number;
    timeSlotId: string;
    classId: string;
  }) => {
    const [teacherConflicts, roomConflicts] = await Promise.all([
      checkTeacherConflicts(entry.teacherId, entry.dayOfWeek, entry.timeSlotId, entry.classId),
      checkRoomConflicts(entry.roomId, entry.dayOfWeek, entry.timeSlotId, entry.classId)
    ]);

    const conflicts = [];
    
    if (teacherConflicts.length > 0) {
      const conflictDetails = teacherConflicts.map((conflict: any) => 
        `${conflict.class.gradeLevel[language === 'ar' ? 'nameAr' : 'name']} - ${conflict.class[language === 'ar' ? 'nameAr' : 'name']} (${conflict.class.section})`
      ).join(', ');
      conflicts.push(`${t('timetable.teacherBusy')}: ${conflictDetails}`);
    }

    if (roomConflicts.length > 0) {
      const conflictDetails = roomConflicts.map((conflict: any) => 
        `${conflict.class.gradeLevel[language === 'ar' ? 'nameAr' : 'name']} - ${conflict.class[language === 'ar' ? 'nameAr' : 'name']} (${conflict.class.section})`
      ).join(', ');
      conflicts.push(`${t('timetable.roomBooked')}: ${conflictDetails}`);
    }

    return conflicts;
  };

  // Check conflicts for current timetable display
  const checkCurrentTimetableConflicts = async () => {
    if (!selectedClass || !timetable.length) return;

    const conflictMap: {[key: string]: any[]} = {};

    for (const day of timetable) {
      for (const slot of day.slots) {
        if (slot.entry?.teacher?.id) {
          const conflictKey = `${day.day}-${slot.timeSlot.id}`;
          const teacherConflicts = await checkTeacherConflicts(
            slot.entry.teacher.id,
            day.day,
            slot.timeSlot.id,
            selectedClass
          );
          const roomConflicts = await checkRoomConflicts(
            slot.entry.room?.id || '',
            day.day,
            slot.timeSlot.id,
            selectedClass
          );
          
          conflictMap[conflictKey] = [...teacherConflicts, ...roomConflicts];
        }
      }
    }

    setConflicts(conflictMap);
  };

  // Check conflicts whenever timetable changes
  useEffect(() => {
    checkCurrentTimetableConflicts();
  }, [timetable, selectedClass]);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    const selectedClassData = classes.find(c => c.id === classId);
    if (selectedClassData) {
      setSelectedGrade(selectedClassData.gradeLevel.level.toString());
    }
  };

  const handleSlotClick = (dayOfWeek: number, timeSlotId: string, entry: TimetableEntry | null) => {
    setSelectedSlot({ dayOfWeek, timeSlotId, entry });
    if (entry) {
      setFormData({
        subjectId: entry.subject?.id || '',
        teacherId: entry.teacher?.id || '',
        roomId: entry.room?.id || '',
        slotType: entry.slotType || 'LESSON',
        notes: entry.notes || ''
      });
    } else {
      setFormData({
        subjectId: '',
        teacherId: '',
        roomId: '',
        slotType: 'LESSON',
        notes: ''
      });
    }
    setEditDialogOpen(true);
  };

  const handleSaveSlot = async () => {
    if (!selectedSlot || !selectedClass) return;

    // Validate conflicts before saving
    if (formData.teacherId || formData.roomId) {
      const conflicts = await validateTimetableEntry({
        teacherId: formData.teacherId,
        roomId: formData.roomId,
        dayOfWeek: selectedSlot.dayOfWeek,
        timeSlotId: selectedSlot.timeSlotId,
        classId: selectedClass
      });

      if (conflicts.length > 0) {
        setError(`تعارض في الجدول:\n${conflicts.join('\n')}`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/timetable/${selectedClass}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSlotId: selectedSlot.timeSlotId,
          dayOfWeek: selectedSlot.dayOfWeek,
          subjectId: formData.subjectId || null,
          teacherId: formData.teacherId || null,
          roomId: formData.roomId || null,
          slotType: formData.slotType,
          notes: formData.notes || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('تم تحديث الجدول بنجاح');
        setEditDialogOpen(false);
        fetchTimetable(selectedClass);
      } else {
        setError(data.error || 'فشل في تحديث الجدول');
      }
    } catch (error) {
      setError('فشل في تحديث الجدول');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!selectedSlot || !selectedClass) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/timetable/${selectedClass}?timeSlotId=${selectedSlot.timeSlotId}&dayOfWeek=${selectedSlot.dayOfWeek}`,
        { method: 'DELETE' }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess('Timetable entry deleted successfully');
        setEditDialogOpen(false);
        fetchTimetable(selectedClass);
      } else {
        setError(data.error || 'Failed to delete timetable entry');
      }
    } catch (error) {
      setError('Failed to delete timetable entry');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAutomaticTimetable = async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      const response = await fetch('/api/timetable/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClass })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(t('timetable.autoTimetableGenerated', { count: data.data.entriesCreated }));
        fetchTimetable(selectedClass);
      } else {
        setError(data.error || t('timetable.failedToGenerateAutoTimetable'));
      }
    } catch (error) {
      setError(t('timetable.failedToGenerateAutoTimetable'));
    } finally {
      setLoading(false);
    }
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

  const renderTimetableGrid = () => {
    if (!timetable.length) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Select a class to view timetable
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Time</TableCell>
              {timetable.map(day => (
                <TableCell key={day.day} sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: 150 }}>
                  <Box>
                    <Typography variant="body2">{day.dayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {day.dayNameAr}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map(slot => (
              <TableRow key={slot.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {slot.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {slot.nameAr}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {slot.startTime} - {slot.endTime}
                    </Typography>
                  </Box>
                </TableCell>
                {timetable.map(day => {
                  const slotData = day.slots.find(s => s.timeSlot.id === slot.id);
                  const entry = slotData?.entry;
                  const conflictKey = `${day.day}-${slot.id}`;
                  const hasConflicts = conflicts[conflictKey]?.length > 0;
                  
                  return (
                    <TableCell
                      key={`${day.day}-${slot.id}`}
                      sx={{ 
                        p: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        position: 'relative'
                      }}
                      onClick={() => handleSlotClick(day.day, slot.id, entry || null)}
                    >
                      {entry ? (
                        <Card 
                          sx={{ 
                            minHeight: 80,
                            bgcolor: entry.subject?.color || getSlotTypeColor(entry.slotType),
                            color: 'white',
                            '&:hover': { transform: 'scale(1.02)' },
                            border: hasConflicts ? '3px solid #f44336' : 'none',
                            position: 'relative'
                          }}
                        >
                          {hasConflicts && (
                            <Tooltip title={`${t('timetable.conflict')}: ${conflicts[conflictKey]?.map(c => `${c.class.gradeLevel[language === 'ar' ? 'nameAr' : 'name']} - ${c.class[language === 'ar' ? 'nameAr' : 'name']}`).join(', ')}`}>
                              <WarningIcon 
                                sx={{ 
                                  position: 'absolute', 
                                  top: 2, 
                                  right: 2, 
                                  color: '#f44336',
                                  fontSize: 16,
                                  bgcolor: 'white',
                                  borderRadius: '50%',
                                  p: 0.2
                                }} 
                              />
                            </Tooltip>
                          )}
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            {entry.subject ? (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                                  {entry.subject.nameAr}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {entry.subject.name}
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
                                {slot.slotType === 'BREAK' ? 'راحة' : 
                                 slot.slotType === 'LUNCH' ? 'غداء' : 
                                 slot.slotType === 'ASSEMBLY' ? 'طابور' : 'حرة'}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Box
                          sx={{
                            minHeight: 80,
                            border: '2px dashed #ccc',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <AddIcon color="action" />
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
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        إدارة الجدول الدراسي
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Time Slot Management */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            إدارة الأوقات
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTimeSlot}
          >
            إضافة وقت جديد
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {timeSlots.map((slot) => (
            <Card key={slot.id} sx={{ minWidth: 200, mb: 1 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {slot.nameAr}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {slot.startTime} - {slot.endTime}
                    </Typography>
                    <Chip 
                      label={slot.slotType} 
                      size="small" 
                      sx={{ 
                        mt: 1,
                        bgcolor: getSlotTypeColor(slot.slotType),
                        color: 'white',
                        fontSize: '0.7rem'
                      }} 
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditTimeSlot(slot)}
                      sx={{ p: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteTimeSlot(slot.id)}
                      sx={{ p: 0.5 }}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

      {/* Conflict Summary */}
      {Object.keys(conflicts).filter(key => conflicts[key].length > 0).length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#ffebee' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WarningIcon sx={{ color: '#f44336', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f44336' }}>
              تعارضات في الجدول
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {Object.entries(conflicts)
              .filter(([_, conflictList]) => conflictList.length > 0)
              .map(([conflictKey, conflictList]) => {
                const [dayStr, timeSlotId] = conflictKey.split('-');
                const day = parseInt(dayStr);
                const timeSlot = timeSlots.find(ts => ts.id === timeSlotId);
                const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                
                return (
                  <Grid item xs={12} md={6} key={conflictKey}>
                    <Alert severity="error" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {dayNames[day]} - {timeSlot?.[language === 'ar' ? 'nameAr' : 'name']} ({timeSlot?.startTime} - {timeSlot?.endTime})
                      </Typography>
                      {conflictList.map((conflict, index) => (
                        <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
                          • {t('timetable.conflictWith')}: {conflict.class.gradeLevel[language === 'ar' ? 'nameAr' : 'name']} - {conflict.class[language === 'ar' ? 'nameAr' : 'name']} ({conflict.class.section})
                          {conflict.teacher && ` - ${t('timetable.teacher')}: ${conflict.teacher.user.firstName} ${conflict.teacher.user.lastName}`}
                        </Typography>
                      ))}
                    </Alert>
                  </Grid>
                );
              })}
          </Grid>
        </Paper>
      )}

      {/* Class Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t('timetable.selectClass')}</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                label={t('timetable.selectClass')}
              >
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.gradeLevel[language === 'ar' ? 'nameAr' : 'name']} - {cls[language === 'ar' ? 'nameAr' : 'name']} ({cls.section}) - {cls.studentCount} {t('common.students')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {selectedClass && (
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SchoolIcon color="primary" />
                <Box>
                  <Typography variant="h6">
                    {classes.find(c => c.id === selectedClass)?.[language === 'ar' ? 'nameAr' : 'name']}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {classes.find(c => c.id === selectedClass)?.gradeLevel[language === 'ar' ? 'nameAr' : 'name']}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {selectedClass && (
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleGenerateAutomaticTimetable}
                disabled={loading}
                fullWidth
                startIcon={<ScheduleIcon />}
              >
                {t('timetable.generateAuto')}
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Timetable Grid */}
      {renderTimetableGrid()}

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSlot?.entry ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  label="Subject"
                >
                  <MenuItem value="">
                    <em>No Subject (Break/Free)</em>
                  </MenuItem>
                  {subjects.map(subject => (
                    <MenuItem key={subject.id} value={subject.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: subject.color
                          }}
                        />
                        {subject.nameAr} ({subject.code})
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Teacher</InputLabel>
                <Select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  label="Teacher"
                  disabled={!formData.subjectId}
                >
                  <MenuItem value="">
                    <em>Select Teacher</em>
                  </MenuItem>
                  {formData.subjectId && subjects
                    .find(s => s.id === formData.subjectId)
                    ?.teachers.map(teacher => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.employeeId})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Room</InputLabel>
                <Select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  label="Room"
                >
                  <MenuItem value="">
                    <em>No Room</em>
                  </MenuItem>
                  {rooms.map(room => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.nameAr} - {room.name} (Floor {room.floor})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Slot Type</InputLabel>
                <Select
                  value={formData.slotType}
                  onChange={(e) => setFormData({ ...formData, slotType: e.target.value })}
                  label="Slot Type"
                >
                  <MenuItem value="LESSON">Lesson</MenuItem>
                  <MenuItem value="BREAK">Break</MenuItem>
                  <MenuItem value="LUNCH">Lunch</MenuItem>
                  <MenuItem value="ASSEMBLY">Assembly</MenuItem>
                  <MenuItem value="FREE">Free Period</MenuItem>
                  <MenuItem value="ACTIVITY">Activity</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          {selectedSlot?.entry && (
            <Button 
              onClick={handleDeleteSlot} 
              color="error"
              disabled={loading}
            >
              Delete
            </Button>
          )}
          <Button 
            onClick={handleSaveSlot} 
            variant="contained"
            disabled={loading}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Slot Management Dialog */}
      <Dialog 
        open={timeSlotDialogOpen} 
        onClose={() => setTimeSlotDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editTimeSlotMode === 'add' ? 'إضافة وقت جديد' : 'تعديل الوقت'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الاسم بالإنجليزية"
                value={timeSlotFormData.name}
                onChange={(e) => setTimeSlotFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الاسم بالعربية"
                value={timeSlotFormData.nameAr}
                onChange={(e) => setTimeSlotFormData(prev => ({ ...prev, nameAr: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="وقت البداية"
                type="time"
                value={timeSlotFormData.startTime}
                onChange={(e) => setTimeSlotFormData(prev => ({ ...prev, startTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="وقت النهاية"
                type="time"
                value={timeSlotFormData.endTime}
                onChange={(e) => setTimeSlotFormData(prev => ({ ...prev, endTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>نوع الوقت</InputLabel>
                <Select
                  value={timeSlotFormData.slotType}
                  onChange={(e) => setTimeSlotFormData(prev => ({ ...prev, slotType: e.target.value }))}
                  label="نوع الوقت"
                >
                  <MenuItem value="LESSON">حصة دراسية</MenuItem>
                  <MenuItem value="BREAK">راحة</MenuItem>
                  <MenuItem value="LUNCH">راحة الغداء</MenuItem>
                  <MenuItem value="ASSEMBLY">الطابور</MenuItem>
                  <MenuItem value="FREE">وقت فراغ</MenuItem>
                  <MenuItem value="ACTIVITY">نشاط</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="المدة (بالدقائق)"
                type="number"
                value={timeSlotFormData.duration}
                onChange={(e) => setTimeSlotFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeSlotDialogOpen(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSaveTimeSlot} 
            variant="contained"
            disabled={!timeSlotFormData.name || !timeSlotFormData.nameAr || !timeSlotFormData.startTime || !timeSlotFormData.endTime}
          >
            {editTimeSlotMode === 'add' ? 'إضافة' : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimetableManager;
