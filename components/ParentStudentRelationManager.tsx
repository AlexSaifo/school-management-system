import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Add, 
  PersonAdd, 
  Delete, 
  Search, 
  Close,
  Person,
  School
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';

// Type for parent data
interface ParentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  relationship: string;
  occupation?: string;
}

// Type for student data
interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  grade?: string;
  gradeAr?: string;
  section?: string;
  classroom?: string;
}

interface ParentStudentRelationProps {
  // Mode determines whether we're managing relations from parent or student side
  mode: 'parent' | 'student';
  
  // The ID of the current parent or student being edited
  currentId?: string;
  
  // Currently selected relations with relationship types
  selectedRelations: Array<{
    parentId?: string;
    studentId?: string;
    relationship: string;
  }>;
  
  // Callback when relations change
  onRelationsChange: (relations: Array<{
    parentId?: string;
    studentId?: string;
    relationship: string;
  }>) => void;
}

const ParentStudentRelationManager: React.FC<ParentStudentRelationProps> = ({
  mode,
  currentId,
  selectedRelations,
  onRelationsChange
}) => {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { token } = useAuth();
  const { showSnackbar } = useSnackbar();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ParentData[] | StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState('Father');
  
  // Get selected relations with details
  const [selectedRelationDetails, setSelectedRelationDetails] = useState<ParentData[] | StudentData[]>([]);
  
  // Track if component has mounted on client to prevent hydration mismatches
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load selected relation details when component mounts or selectedRelations changes
  useEffect(() => {
    if (selectedRelations.length > 0) {
      if (currentId) {
        // For existing parents/students, fetch existing details from API and combine with new ones
        fetchCombinedRelationDetails();
      } else {
        // For new parents/students, fetch student/parent details directly
        fetchDirectRelationDetails();
      }
    } else {
      setSelectedRelationDetails([]);
    }
  }, [selectedRelations, currentId]);

  // Fetch details for selected relations
  const fetchSelectedRelationDetails = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Determine endpoint based on mode
      const endpoint = mode === 'parent' 
        ? `/api/users/parents/${currentId}/students` 
        : `/api/users/students/${currentId}/parents`;
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedRelationDetails(data.data || []);
      } else {
        console.error('Failed to fetch relation details');
        showSnackbar('Failed to load relation details');
      }
    } catch (error) {
      console.error('Error fetching relation details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch combined details for existing and new relations
  const fetchCombinedRelationDetails = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // First, fetch existing relations from database
      const endpoint = mode === 'parent' 
        ? `/api/users/parents/${currentId}/students` 
        : `/api/users/students/${currentId}/parents`;
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      let existingDetails = [];
      if (response.ok) {
        const data = await response.json();
        existingDetails = data.data || [];
      }
      
      // Then, fetch details for newly added relations that aren't in the database yet
      const existingIds = new Set(existingDetails.map((detail: any) => detail.id));
      const newRelations = selectedRelations.filter(relation => {
        const itemId = mode === 'parent' ? relation.studentId : relation.parentId;
        return !existingIds.has(itemId);
      });
      
      if (newRelations.length > 0) {
        const newDetailsPromises = newRelations.map(async (relation) => {
          const itemId = mode === 'parent' ? relation.studentId : relation.parentId;
          const detailEndpoint = mode === 'parent' 
            ? `/api/users/students/${itemId}` 
            : `/api/users/parents/${itemId}`;
          
          const detailResponse = await fetch(detailEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            const item = detailData.data;
            
            // Transform to match the format and add relationship
            if (mode === 'parent') {
              return {
                id: item.id,
                studentId: item.studentId,
                firstName: item.user.firstName,
                lastName: item.user.lastName,
                email: item.user.email,
                grade: item.grade || '',
                gradeAr: item.gradeAr || '',
                section: item.section || '',
                classroom: item.class || item.classroom || '',
                relationship: relation.relationship
              };
            } else {
              return {
                id: item.id,
                firstName: item.user.firstName,
                lastName: item.user.lastName,
                email: item.user.email,
                phone: item.user.phoneNumber,
                relationship: relation.relationship,
                occupation: item.occupation
              };
            }
          } else {
            console.error('Failed to fetch detail for relation');
            showSnackbar('Failed to load relation details');
            return null;
          }
        });
        
        const newDetails = await Promise.all(newDetailsPromises);
        const validNewDetails = newDetails.filter(detail => detail !== null);
        
        // Combine existing and new details
        setSelectedRelationDetails([...existingDetails, ...validNewDetails]);
      } else {
        setSelectedRelationDetails(existingDetails);
      }
    } catch (error) {
      console.error('Error fetching combined relation details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch details directly for new parents/students
  const fetchDirectRelationDetails = async () => {
    if (!token || selectedRelations.length === 0) return;
    
    setLoading(true);
    try {
      // Fetch details for each selected relation
      const detailsPromises = selectedRelations.map(async (relation) => {
        const itemId = mode === 'parent' ? relation.studentId : relation.parentId;
        const endpoint = mode === 'parent' 
          ? `/api/users/students/${itemId}` 
          : `/api/users/parents/${itemId}`;
        
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const item = data.data;
          
          // Transform to match search result format
          if (mode === 'parent') {
            // For students (when mode is parent)
            return {
              id: item.id,
              studentId: item.studentId,
              firstName: item.user.firstName,
              lastName: item.user.lastName,
              email: item.user.email,
              grade: item.grade || '',
              gradeAr: item.gradeAr || '',
              section: item.section || '',
              classroom: item.class || item.classroom || ''
            };
          } else {
            // For parents (when mode is student)
            return {
              id: item.id,
              firstName: item.user.firstName,
              lastName: item.user.lastName,
              email: item.user.email,
              phone: item.user.phoneNumber,
              relationship: item.relationship,
              occupation: item.occupation
            };
          }
        } else {
          console.error('Failed to fetch relation detail');
          showSnackbar('Failed to load relation details');
          return null;
        }
      });
      
      const details = await Promise.all(detailsPromises);
      const validDetails = details.filter(detail => detail !== null);
      setSelectedRelationDetails(validDetails as any);
    } catch (error) {
      console.error('Error fetching direct relation details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search for students or parents to add
  const handleSearch = async () => {
    if (!searchTerm || !token) return;
    
    setLoading(true);
    try {
      // Determine search endpoint based on mode
      const endpoint = mode === 'parent' 
        ? `/api/users/students/search?term=${encodeURIComponent(searchTerm)}` 
        : `/api/users/parents/search?term=${encodeURIComponent(searchTerm)}`;
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out already selected relations
        const filteredResults = (data.data || []).filter(
          (item: any) => !selectedRelations.some(relation => 
            (mode === 'parent' ? relation.studentId : relation.parentId) === item.id
          )
        );
        setSearchResults(filteredResults);
      } else {
        console.error('Search failed');
        showSnackbar('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a relation
  const handleAddRelation = (itemId: string, relationship: string) => {
    const newRelation = mode === 'parent' 
      ? { studentId: itemId, relationship }
      : { parentId: itemId, relationship };
    const newRelations = [...selectedRelations, newRelation];
    onRelationsChange(newRelations);
    // Close dialog and clear search results
    setDialogOpen(false);
    setSearchResults([]);
    setSearchTerm('');
  };

  // Handle removing a relation
  const handleRemoveRelation = (itemId: string) => {
    const newRelations = selectedRelations.filter(relation => 
      (mode === 'parent' ? relation.studentId : relation.parentId) !== itemId
    );
    onRelationsChange(newRelations);
  };

  // Show the appropriate icon and text based on mode
  const relationIcon = mode === 'parent' ? <School /> : <Person />;
  const relationTitle = mode === 'parent' 
    ? t('students.title') 
    : t('navigation.parents');
  const addButtonText = mode === 'parent' 
    ? t('students.addStudent') 
    : t('users.addParent');
  const searchPlaceholder = mode === 'parent' 
    ? t('students.searchStudents') 
    : t('users.searchParents');
  const noRelationsText = mode === 'parent' 
    ? t('students.noStudentsAssigned') 
    : t('users.noParentsAssigned');
  const dialogTitle = mode === 'parent' 
    ? t('students.addStudentToParent') 
    : t('users.addParentToStudent');

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {relationTitle}
        </Typography>
        <Button 
          startIcon={<Add />} 
          variant="outlined" 
          onClick={() => setDialogOpen(true)}
        >
          {addButtonText}
        </Button>
      </Box>
      
      {/* Display selected relations */}
      <Paper variant="outlined" sx={{ mb: 2, p: 1 }}>
        {selectedRelations.length > 0 ? (
          <List dense>
            {selectedRelations.map((relation) => {
              // Find detailed info if available
              const itemId = mode === 'parent' ? relation.studentId : relation.parentId;
              const relationDetails = mounted ? selectedRelationDetails.find((detail: any) => detail.id === itemId) : null;
              
              return (
                <ListItem key={itemId} divider>
                  <Avatar sx={{ mr: 2, bgcolor: mode === 'parent' ? 'secondary.main' : 'primary.main' }} suppressHydrationWarning>
                    {relationDetails?.firstName ? relationDetails.firstName[0] : '?'}
                  </Avatar>
                  <ListItemText 
                    primary={
                      relationDetails 
                        ? `${relationDetails.firstName} ${relationDetails.lastName}`
                        : `${mode === 'parent' ? 'Student' : 'Parent'} ID: ${itemId}`
                    }
                    secondary={
                      <span suppressHydrationWarning>
                        {relationDetails && mode === 'parent' && 'studentId' in relationDetails
                          ? (() => {
                              const parts = [];
                              if (relationDetails.studentId) {
                                parts.push(`${t('students.studentId')}: ${relationDetails.studentId}`);
                              }
                              if (relationDetails.grade) {
                                const gradeDisplay = language === 'ar' && relationDetails.gradeAr 
                                  ? relationDetails.gradeAr 
                                  : relationDetails.grade;
                                parts.push(`${t('students.grade')}: ${gradeDisplay}`);
                              }
                              if (relationDetails.section) {
                                parts.push(`${t('students.section')}: ${relationDetails.section}`);
                              }
                              if (relationDetails.classroom) {
                                parts.push(`${t('students.classroom')}: ${relationDetails.classroom}`);
                              }
                              if (relationDetails.email) {
                                parts.push(`${t('users.email')}: ${relationDetails.email}`);
                              }
                              parts.push(`${t('users.relationship')}: ${t(`users.relationships.${relation.relationship}`, { defaultValue: relation.relationship })}`);
                              return parts.join(' | ');
                            })()
                          : relationDetails && mode === 'student' && 'relationship' in relationDetails
                            ? `${t('users.relationship')}: ${t(`users.relationships.${relationDetails.relationship}`, { defaultValue: relationDetails.relationship })}${relationDetails.occupation ? ` | ${t('users.occupation')}: ${relationDetails.occupation}` : ''}${relationDetails.email ? ` | ${t('users.email')}: ${relationDetails.email}` : ''}${relationDetails.phone ? ` | ${t('users.phoneNumber')}: ${relationDetails.phone}` : ''}`
                            : `${t('users.relationship')}: ${t(`users.relationships.${relation.relationship}`, { defaultValue: relation.relationship })}`}
                      </span>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleRemoveRelation(itemId!)}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box p={2} textAlign="center">
            <Typography color="textSecondary">
              {noRelationsText}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Search Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <Box my={2}>
            <TextField
              fullWidth
              label={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <IconButton onClick={handleSearch}>
                        <Search />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </Box>

          {/* Relationship Type Selector - Keep this always visible */}
          <Box my={2} sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
            <TextField
              select
              fullWidth
              label={t('users.relationship')}
              value={selectedRelationship}
              onChange={(e) => setSelectedRelationship(e.target.value)}
            >
              <MenuItem value="Father">{t('users.relationships.Father', { defaultValue: 'Father' })}</MenuItem>
              <MenuItem value="Mother">{t('users.relationships.Mother', { defaultValue: 'Mother' })}</MenuItem>
              <MenuItem value="Step-Father">{t('users.relationships.Step-Father', { defaultValue: 'Step-Father' })}</MenuItem>
              <MenuItem value="Step-Mother">{t('users.relationships.Step-Mother', { defaultValue: 'Step-Mother' })}</MenuItem>
              <MenuItem value="Guardian">{t('users.relationships.Guardian', { defaultValue: 'Guardian' })}</MenuItem>
              <MenuItem value="Grandfather">{t('users.relationships.Grandfather', { defaultValue: 'Grandfather' })}</MenuItem>
              <MenuItem value="Grandmother">{t('users.relationships.Grandmother', { defaultValue: 'Grandmother' })}</MenuItem>
              <MenuItem value="Other">{t('users.relationships.Other', { defaultValue: 'Other' })}</MenuItem>
            </TextField>
          </Box>

          {/* Search Results - Make this scrollable */}
          <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {searchResults.length > 0 ? (
              <List>
                {searchResults.map((result: any) => (
                  <ListItem
                    key={result.id}
                    button
                    onClick={() => handleAddRelation(result.id, selectedRelationship)}
                    divider
                  >
                    <Avatar sx={{ mr: 2, bgcolor: mode === 'parent' ? 'secondary.main' : 'primary.main' }}>
                      {result.firstName ? result.firstName[0] : '?'}
                    </Avatar>
                    <ListItemText
                      primary={`${result.firstName} ${result.lastName}`}
                      secondary={
                        mode === 'parent'
                          ? (() => {
                              const gradeDisplay = language === 'ar' && result.gradeAr
                                ? result.gradeAr
                                : result.grade;
                              const parts = [];
                              if (result.studentId) {
                                parts.push(`${t('students.studentId')}: ${result.studentId}`);
                              }
                              if (gradeDisplay || result.section) {
                                parts.push(`${gradeDisplay || ''} ${result.section || ''}`.trim());
                              }
                              if (result.classroom) {
                                parts.push(`${t('students.classroom')}: ${result.classroom}`);
                              }
                              if (result.email) {
                                parts.push(`${t('users.email')}: ${result.email}`);
                              }
                              return parts.join(' | ');
                            })()
                          : (() => {
                              const parts = [];
                              parts.push(`${t('users.email')}: ${result.email}`);
                              if (result.phone) {
                                parts.push(`${t('users.phoneNumber')}: ${result.phone}`);
                              }
                              if (result.occupation) {
                                parts.push(`${t('users.occupation')}: ${result.occupation}`);
                              }
                              return parts.join(' | ');
                            })()
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box p={2} textAlign="center">
                <Typography color="textSecondary">
                  {searchTerm.length > 0 && !loading
                    ? t('common.noResults')
                    : t('common.searchToFindResults')}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentStudentRelationManager;