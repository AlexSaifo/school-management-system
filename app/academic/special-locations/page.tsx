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
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Science as ScienceIcon,
  Computer as ComputerIcon,
  MusicNote as MusicIcon,
  Palette as ArtIcon,
  FitnessCenter as GymIcon,
  MenuBook as LibraryIcon,
  Restaurant as CafeteriaIcon,
  Storage as StorageIcon,
  Theaters as AuditoriumIcon,
  LocationOn as LocationIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layout/SidebarLayout';
import DataTable, { Column, Action } from '@/components/DataTable';
import FilterPanel, { Filter, FilterOption } from '@/components/FilterPanel';
import PageHeader from '@/components/PageHeader';

// Utility function to convert database keys to translation keys
const formatKeyForTranslation = (key: string): string => {
  // Convert UPPER_CASE or UPPERCASE to lowercase with underscores
  return key.toLowerCase().replace(/([a-z])([A-Z])/g, '$1_$2').replace(/\s+/g, '_');
};

interface SpecialLocation {
  id: string;
  name: string;
  nameAr: string;
  type: string;
  floor: number;
  capacity: number;
  facilities: string[];
  isActive: boolean;
  description?: string;
  descriptionAr?: string;
}

const locationTypeIcons: { [key: string]: React.ReactNode } = {
  LABORATORY: <ScienceIcon />,
  COMPUTER_LAB: <ComputerIcon />,
  MUSIC_ROOM: <MusicIcon />,
  ART_ROOM: <ArtIcon />,
  GYMNASIUM: <GymIcon />,
  LIBRARY: <LibraryIcon />,
  CAFETERIA: <CafeteriaIcon />,
  STORAGE: <StorageIcon />,
  AUDITORIUM: <AuditoriumIcon />,
  PLAYGROUND: <LocationIcon />,
  OFFICE: <LocationIcon />,
  OTHER: <LocationIcon />
};

const locationTypeColors: { [key: string]: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' } = {
  LABORATORY: 'primary',
  COMPUTER_LAB: 'info',
  MUSIC_ROOM: 'secondary',
  ART_ROOM: 'warning',
  GYMNASIUM: 'success',
  LIBRARY: 'primary',
  CAFETERIA: 'warning',
  STORAGE: 'error',
  AUDITORIUM: 'secondary',
  PLAYGROUND: 'info',
  OFFICE: 'primary',
  OTHER: 'warning'
};

// Column configuration for DataTable
const getColumns = (t: any): Column[] => [
  {
    key: 'type',
    label: t('academic.specialLocations.type'),
    render: (value: any, row: any) => (
      <Box display="flex" alignItems="center">
        <Avatar sx={{ bgcolor: `${locationTypeColors[value] || 'primary'}.main`, mr: 2, width: 32, height: 32 }}>
          {locationTypeIcons[value] ? 
            React.cloneElement(locationTypeIcons[value] as React.ReactElement, { fontSize: 'small' }) : 
            <LocationIcon fontSize="small" />}
        </Avatar>
        <Typography variant="body2">
          {t(`academic.specialLocations.types.${formatKeyForTranslation(value)}`, { defaultValue: value })}
        </Typography>
      </Box>
    ),
  },
  {
    key: 'name',
    label: t('academic.specialLocations.name'),
    render: (value: any, row: any) => (
      <Box>
        <Typography variant="body2">{value}</Typography>
        <Typography variant="caption" color="text.secondary">
          {row.nameAr}
        </Typography>
      </Box>
    ),
  },
  {
    key: 'floor',
    label: t('academic.specialLocations.floor'),
    render: (value: any) => (
      <Typography variant="body2">
        {t('academic.specialLocations.floor')} {value}
      </Typography>
    ),
  },
  {
    key: 'capacity',
    label: t('academic.specialLocations.capacity'),
    render: (value: any) => (
      <Typography variant="body2">{value}</Typography>
    ),
  },
  {
    key: 'facilities',
    label: t('academic.specialLocations.facilitiesLabel'),
    render: (value: any) => (
      <Box display="flex" flexWrap="wrap" gap={0.5}>
        {value.slice(0, 2).map((facility: string) => (
          <Chip 
            key={facility}
            label={t(`academic.specialLocations.facilities.${formatKeyForTranslation(facility)}`, { defaultValue: facility })}
            size="small"
            variant="outlined"
          />
        ))}
        {value.length > 2 && (
          <Chip 
            label={`+${value.length - 2}`}
            size="small"
            variant="outlined"
          />
        )}
      </Box>
    ),
  },
  {
    key: 'isActive',
    label: t('academic.specialLocations.status'),
    render: (value: any) => (
      <Chip 
        label={value ? t('common.active') : t('common.inactive')} 
        color={value ? 'success' : 'default'}
        size="small"
      />
    ),
  },
];

// Action configuration for DataTable
const getActions = (t: any, onEdit: (item: SpecialLocation) => void, onDelete: (id: string) => void): Action[] => [
  {
    key: 'edit',
    label: t('common.edit'),
    icon: <EditIcon />,
    onClick: onEdit,
  },
  {
    key: 'delete',
    label: t('common.delete'),
    icon: <DeleteIcon />,
    onClick: (item: any) => onDelete(item.id),
    color: 'error' as const,
  },
];

// Filter configuration for FilterPanel
const getFilters = (t: any, locationTypeOptions: any[]): Filter[] => [
  {
    key: 'type',
    label: t('academic.specialLocations.filterByType'),
    type: 'select',
    options: [
      { value: '', label: t('common.all') },
      ...locationTypeOptions.map(type => ({
        value: type.value,
        label: t(type.label)
      }))
    ],
    value: '',
    onChange: () => {},
  },
];

export default function SpecialLocationsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === 'ar';
  
  const [specialLocations, setSpecialLocations] = useState<SpecialLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SpecialLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    type: '',
    floor: 1,
    capacity: 30,
    facilities: [] as string[],
    isActive: true,
    description: '',
    descriptionAr: ''
  });

  const locationTypeOptions = [
    { value: 'LABORATORY', label: 'academic.specialLocations.types.laboratory' },
    { value: 'COMPUTER_LAB', label: 'academic.specialLocations.types.computer_lab' },
    { value: 'MUSIC_ROOM', label: 'academic.specialLocations.types.music_room' },
    { value: 'ART_ROOM', label: 'academic.specialLocations.types.art_room' },
    { value: 'GYMNASIUM', label: 'academic.specialLocations.types.gymnasium' },
    { value: 'LIBRARY', label: 'academic.specialLocations.types.library' },
    { value: 'CAFETERIA', label: 'academic.specialLocations.types.cafeteria' },
    { value: 'STORAGE', label: 'academic.specialLocations.types.storage' },
    { value: 'AUDITORIUM', label: 'academic.specialLocations.types.auditorium' },
    { value: 'PLAYGROUND', label: 'academic.specialLocations.types.playground' },
    { value: 'OFFICE', label: 'academic.specialLocations.types.office' },
    { value: 'OTHER', label: 'academic.specialLocations.types.other' }
  ];

  const facilityOptions = [
    { value: 'WHITEBOARD', label: 'academic.specialLocations.facilities.whiteboard' },
    { value: 'PROJECTOR', label: 'academic.specialLocations.facilities.projector' },
    { value: 'AC', label: 'academic.specialLocations.facilities.ac' },
    { value: 'WIFI', label: 'academic.specialLocations.facilities.wifi' },
    { value: 'COMPUTER', label: 'academic.specialLocations.facilities.computer' },
    { value: 'COMPUTERS', label: 'academic.specialLocations.facilities.computers' },
    { value: 'SOUND_SYSTEM', label: 'academic.specialLocations.facilities.sound_system' },
    { value: 'EQUIPMENT_STORAGE', label: 'academic.specialLocations.facilities.equipment_storage' },
    { value: 'SAFETY_EQUIPMENT', label: 'academic.specialLocations.facilities.safety_equipment' },
    { value: 'MICROSCOPES', label: 'academic.specialLocations.facilities.microscopes' },
    { value: 'PHYSICS_EQUIPMENT', label: 'academic.specialLocations.facilities.physics_equipment' },
    { value: 'BOOKS', label: 'academic.specialLocations.facilities.books' },
    { value: 'SPORTS_EQUIPMENT', label: 'academic.specialLocations.facilities.sports_equipment' },
    { value: 'STAGE', label: 'academic.specialLocations.facilities.stage' },
    { value: 'ART_SUPPLIES', label: 'academic.specialLocations.facilities.art_supplies' },
    { value: 'EASELS', label: 'academic.specialLocations.facilities.easels' },
    { value: 'PIANO', label: 'academic.specialLocations.facilities.piano' },
    { value: 'INSTRUMENTS', label: 'academic.specialLocations.facilities.instruments' },
    { value: 'OUTDOOR_EQUIPMENT', label: 'academic.specialLocations.facilities.outdoor_equipment' },
    { value: 'SEATING_AREAS', label: 'academic.specialLocations.facilities.seating_areas' }
  ];

  useEffect(() => {
    fetchSpecialLocations();
  }, []);

  const fetchSpecialLocations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/academic/special-locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch special locations');
      }

      const data = await response.json();
      setSpecialLocations(data.specialLocations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch special locations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (location?: SpecialLocation) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        nameAr: location.nameAr,
        type: location.type,
        floor: location.floor,
        capacity: location.capacity,
        facilities: location.facilities,
        isActive: location.isActive,
        description: location.description || '',
        descriptionAr: location.descriptionAr || ''
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        nameAr: '',
        type: '',
        floor: 1,
        capacity: 30,
        facilities: [],
        isActive: true,
        description: '',
        descriptionAr: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLocation(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const url = editingLocation 
        ? `/api/academic/special-locations/${editingLocation.id}`
        : '/api/academic/special-locations';
      
      const method = editingLocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save special location');
      }

      await fetchSpecialLocations();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save special location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm(t('academic.specialLocations.confirmDelete'))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/academic/special-locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete special location');
      }

      await fetchSpecialLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete special location');
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

  const getFilteredLocations = () => {
    return specialLocations.filter(location => {
      if (filterType && location.type !== filterType) return false;
      return true;
    });
  };

  const getLocationsByType = () => {
    const locationsByType: { [key: string]: SpecialLocation[] } = {};
    specialLocations.forEach(location => {
      if (!locationsByType[location.type]) {
        locationsByType[location.type] = [];
      }
      locationsByType[location.type].push(location);
    });
    return locationsByType;
  };

  const filteredLocations = getFilteredLocations();
  const locationsByType = getLocationsByType();

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
        {/* Page Header */}
        <PageHeader
          title={t('academic.specialLocations.title')}
          actionLabel={t('academic.specialLocations.addLocation')}
          actionIcon={<AddIcon />}
          onAction={() => handleOpenDialog()}
        />

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
                  <LocationIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {specialLocations.length}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('academic.specialLocations.totalLocations')}
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
                  <ScienceIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {specialLocations.filter(loc => loc.isActive).length}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('academic.specialLocations.activeLocations')}
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
                  <ComputerIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {Object.keys(locationsByType).length}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('academic.specialLocations.locationTypes')}
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
                  <MusicIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {specialLocations.reduce((total, loc) => total + loc.capacity, 0)}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('academic.specialLocations.totalCapacity')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Location Type Overview */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('academic.specialLocations.locationsByType')}
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(locationsByType).map(([type, locations]) => (
                <Grid item xs={12} sm={6} md={4} key={type}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    p={2} 
                    border={1} 
                    borderColor="divider" 
                    borderRadius={1}
                  >
                    <Avatar sx={{ bgcolor: `${locationTypeColors[type]}.main`, mr: 2 }}>
                      {locationTypeIcons[type]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {t(`academic.specialLocations.types.${formatKeyForTranslation(type)}`, { defaultValue: type })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {locations.length} {t('academic.specialLocations.locations')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Filters */}
        <FilterPanel
          searchTerm=""
          onSearchChange={() => {}}
          filters={getFilters(t, locationTypeOptions).map(filter => ({
            ...filter,
            value: filterType,
            onChange: (value: string) => setFilterType(value)
          }))}
        />

        {/* Special Locations Table */}
        <DataTable
          data={filteredLocations}
          columns={getColumns(t)}
          actions={getActions(t, handleOpenDialog, handleDelete)}
          loading={loading}
          emptyMessage={t('academic.specialLocations.noLocations')}
          selectable={false}
        />

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingLocation ? t('academic.specialLocations.editLocation') : t('academic.specialLocations.addLocation')}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('academic.specialLocations.type')}</InputLabel>
                  <Select
                    value={formData.type}
                    label={t('academic.specialLocations.type')}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {locationTypeOptions.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {t(type.label)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('academic.specialLocations.nameEn')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('academic.specialLocations.nameAr')}
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('academic.specialLocations.capacity')}
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('academic.specialLocations.floor')}
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('academic.specialLocations.descriptionEn')}
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('academic.specialLocations.descriptionAr')}
                  multiline
                  rows={2}
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label={t('academic.specialLocations.isActive')}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('academic.specialLocations.facilitiesList')}
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
              disabled={submitting || !formData.type || !formData.name}
            >
              {submitting ? <CircularProgress size={20} /> : t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
