'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

interface Subject {
  id: string;
  name: string;
  nameAr: string;
  code: string;
}

interface TeacherSubjectManagerProps {
  open: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  currentSubjects: Subject[];
  onUpdate: () => void;
}

export default function TeacherSubjectManager({
  open,
  onClose,
  teacherId,
  teacherName,
  currentSubjects,
  onUpdate,
}: TeacherSubjectManagerProps) {
  const { token } = useAuth();
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected subjects when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSubjects(currentSubjects.map(s => s.id));
      fetchAllSubjects();
    }
  }, [open, currentSubjects]);

  const fetchAllSubjects = async () => {
    try {
      const response = await fetch('/api/academic/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllSubjects(data.data || []);
      } else {
        setError('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Error fetching subjects');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/teachers/${teacherId}/subjects`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subjectIds: selectedSubjects }),
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update teacher subjects');
      }
    } catch (error) {
      console.error('Error updating teacher subjects:', error);
      setError('Error updating teacher subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const selectedSubjectObjects = allSubjects.filter(s => selectedSubjects.includes(s.id));
  const availableSubjects = allSubjects.filter(s => !selectedSubjects.includes(s.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Manage Subjects for {teacherName}
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Assigned Subjects */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Assigned Subjects ({selectedSubjectObjects.length})
            </Typography>
            <Box sx={{ minHeight: 200, border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
              {selectedSubjectObjects.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No subjects assigned
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedSubjectObjects.map(subject => (
                    <Chip
                      key={subject.id}
                      label={`${subject.name} (${subject.code})`}
                      onDelete={() => handleSubjectToggle(subject.id)}
                      color="primary"
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Available Subjects */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Available Subjects ({availableSubjects.length})
            </Typography>
            <Box sx={{ minHeight: 200, border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
              {availableSubjects.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  All subjects assigned
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableSubjects.map(subject => (
                    <Chip
                      key={subject.id}
                      label={`${subject.name} (${subject.code})`}
                      onClick={() => handleSubjectToggle(subject.id)}
                      variant="outlined"
                      clickable
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Click on subjects to assign/unassign them. Assigned subjects are shown with colored chips.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}