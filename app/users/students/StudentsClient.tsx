"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  Tooltip,
  Alert,
  Checkbox,
  InputAdornment,
  Pagination,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
} from "@mui/material";
import ParentStudentRelationManager from "@/components/ParentStudentRelationManager";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PersonAdd,
  School,
  Search,
  GetApp,
  Block,
  CheckCircle,
  Print,
} from "@mui/icons-material";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CryptoJS from 'crypto-js';
import DataTable, { Column, Action } from "@/components/DataTable";
import FilterPanel, { Filter, FilterOption, BulkAction } from "@/components/FilterPanel";
import PageHeader from "@/components/PageHeader";
import PaginationControls from "@/components/PaginationControls";

// AES encryption utilities
const SECRET_KEY = process.env.NEXT_PUBLIC_AES_SECRET_KEY || 'your-secret-key-here';

const decryptPassword = (encryptedPassword: string): string => {
  if (encryptedPassword.startsWith('$2a$') || encryptedPassword.startsWith('$2b$') || encryptedPassword.startsWith('$2y$')) {
    // Legacy bcrypt hash - return placeholder since we can't decrypt
    return '••••••••';
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return '••••••••';
  }
};

interface GradeLevel {
  id: string;
  name: string;
  nameAr: string;
  level: number;
  description?: string;
  isActive: boolean;
}

interface ClassRoom {
  id: string;
  name: string;
  nameAr: string;
  section: string;
  sectionNumber: number;
  gradeLevelId: string;
  gradeLevel: GradeLevel;
  roomNumber: string;
  floor: number;
  capacity: number;
  academicYear: string;
  isActive: boolean;
  _count: {
    students: number;
  };
}

interface Parent {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    status: string;
  };
  occupation?: string;
  relationship: string;
}

interface ParentRelation {
  parent: Parent;
}

interface Student {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string; // Using the correct field name from schema
    address: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    createdAt: string;
    updatedAt: string;
  };
  studentId: string;
  student?: {
    classRoomId: string;
    classRoom?: {
      id: string;
      name: string;
      nameAr: string;
      section: string;
      academicYear: string;
      gradeLevel?: {
        id: string;
        name: string;
        nameAr: string;
      }
    };
    rollNumber: string;
    dateOfBirth: string;
    bloodGroup: string;
    emergencyContact: string;
    admissionDate: string;
    parents?: ParentRelation[];
  };
  // Parents array from API response
  parents?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    relationship: string;
  }[];
  // For backward compatibility with existing code
  grade?: string;
  section?: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  admissionDate?: string;
  academicYear?: string;
  // Additional fields that might be at top level based on API response
  rollNumber?: string;
  bloodGroup?: string;
  emergencyContact?: string;
}

// Zod validation schema for creating students (password required)
const createStudentFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  studentId: z.string().min(1, 'Student ID is required'),
  classRoomId: z.string().min(1, 'Classroom is required'),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  admissionDate: z.string().min(1, 'Admission date is required'),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Confirm password must match password
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Zod validation schema for editing students (password optional)
const editStudentFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  studentId: z.string().min(1, 'Student ID is required'),
  classRoomId: z.string().min(1, 'Classroom is required'),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  admissionDate: z.string().min(1, 'Admission date is required'),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  password: z.string().optional().refine((val) => !val || val.length >= 6, {
    message: 'Password must be at least 6 characters',
  }),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If password is provided, confirm password must also be provided and match
  if (data.password) {
    return data.confirmPassword && data.password === data.confirmPassword;
  }
  // If no password, confirm password should also be empty
  return !data.confirmPassword;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type StudentFormData = z.infer<typeof createStudentFormSchema> | z.infer<typeof editStudentFormSchema>;

export default function StudentsClient() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const locale = isRTL ? 'ar' : 'en-US'; // Use 'ar' instead of 'ar-SA' to avoid Hijri calendar as default
  // Define date format options to force Gregorian calendar
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric", 
    month: "long", 
    day: "numeric"
    // Removed calendar: "gregory" to prevent hydration mismatches
  };
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    count: 0,
    limit: 10,
  });
  const [pageSize, setPageSize] = useState(10);
  
  // React Hook Form setup with conditional Zod validation
  const currentSchema = useMemo(() => 
    selectedStudent ? editStudentFormSchema : createStudentFormSchema, 
    [selectedStudent]
  );
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<StudentFormData>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      studentId: "",
      classRoomId: "",
      dateOfBirth: "",
      bloodGroup: "",
      emergencyContact: "",
      admissionDate: "",
      rollNumber: "",
      guardianName: "",
      guardianPhone: "",
      password: "",
      confirmPassword: "",
    }
  });

  // Keep formData for backward compatibility with existing logic
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "", // We'll keep this as phoneNumber in the form for clarity, but the API will map it to phone
    address: "",
    studentId: "",
    classRoomId: "",
    dateOfBirth: "",
    bloodGroup: "",
    emergencyContact: "",
    admissionDate: "",
    rollNumber: "",
    guardianName: "",
    guardianPhone: "",
  });
  
  // Additional state for dropdown data
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [filteredClassRooms, setFilteredClassRooms] = useState<ClassRoom[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  
  // State for parent relations with relationship types
  const [parentRelations, setParentRelations] = useState<Array<{
    parentId: string;
    relationship: string;
  }>>([]);

  useEffect(() => {
    if (token) {
      fetchStudents(1);
      setPagination((prev) => ({ ...prev, current: 1 }));
      fetchGradeLevels();
      fetchClassRooms();
    }
  }, [token, searchTerm, statusFilter, gradeFilter, pageSize]);

  // Make sure grade levels and classrooms are loaded when opening the dialog
  // Add effect to synchronize classroom and grade selection
  useEffect(() => {
    // If we have a classroom ID but no grade selected, find the classroom and set the grade
    if (formData.classRoomId && !selectedGradeId) {
      console.log("Synchronizing grade selection from classroom ID:", formData.classRoomId);
      const classroom = classRooms.find(cr => cr.id === formData.classRoomId);
      if (classroom) {
        console.log("Found classroom, setting grade level ID:", classroom.gradeLevelId);
        setSelectedGradeId(classroom.gradeLevelId);
        
        // Filter classrooms by this grade level
        const filtered = classRooms.filter(cr => cr.gradeLevelId === classroom.gradeLevelId);
        setFilteredClassRooms(filtered);
      }
    }
  }, [formData.classRoomId, classRooms]);

  useEffect(() => {
    if (openDialog && token && (!gradeLevels.length || !classRooms.length)) {
      fetchGradeLevels();
      fetchClassRooms();
    }
  }, [openDialog, token]);
  
  // Clear confirm password when password is cleared
  useEffect(() => {
    const passwordValue = watch('password');
    if (!passwordValue && watch('confirmPassword')) {
      setValue('confirmPassword', '');
    }
  }, [watch('password'), setValue]);
  
  // States to track loading for different data sets
  const [loadingGradeLevels, setLoadingGradeLevels] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  
  // Fetch grade levels from API
  const fetchGradeLevels = async () => {
    try {
      setLoadingGradeLevels(true);
      const response = await fetch(`/api/academic/grade-levels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGradeLevels(data.gradeLevels || []);
      }
    } catch (error) {
      console.error("Error fetching grade levels:", error);
    } finally {
      setLoadingGradeLevels(false);
    }
  };

  // Fetch all classrooms with their capacities and current students count
  const fetchClassRooms = async () => {
    try {
      setLoadingClassrooms(true);
      const response = await fetch(`/api/academic/classrooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClassRooms(data.classRooms || []);
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    } finally {
      setLoadingClassrooms(false);
    }
  };

  // Filter classrooms based on selected grade level and check capacity
  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    
    // Filter classrooms by selected grade and check if they have available capacity
    // If we're editing a student, include their current classroom even if it's at capacity
    const studentClassroomId = selectedStudent?.student?.classRoomId || '';
    
    const filtered = classRooms.filter(classroom => 
      classroom.gradeLevelId === gradeId && 
      (classroom._count.students < classroom.capacity || classroom.id === studentClassroomId)
    );
    
    setFilteredClassRooms(filtered);
    
    // If we're editing a student and their classroom is in the filtered list, keep it selected
    // Otherwise, clear the selected classroom
    const keepCurrentClassroom = 
      selectedStudent && 
      studentClassroomId && 
      filtered.some(classroom => classroom.id === studentClassroomId);
    
    if (!keepCurrentClassroom) {
      setFormData(prevData => ({
        ...prevData,
        classRoomId: ""
      }));
    }
  };

  const fetchStudents = async (page = pagination.current) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (gradeFilter !== "all") params.append("grade", gradeFilter);
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      const response = await fetch(`/api/users/students?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const response_data = await response.json();
        console.log("Student API Response:", response_data.data?.students?.[0]);
        
        // Add student.student data structure for proper localization
        const students = (response_data.data?.students || []).map((student: any) => ({
          ...student,
          student: {
            classRoom: student.classRoomData ? {
              name: student.classroom || student.class || '',
              nameAr: student.classroomAr || student.classAr || student.classroom || student.class || '',
              section: student.section || '',
              gradeLevel: student.gradeLevelData ? {
                name: student.grade || '',
                nameAr: student.gradeAr || student.grade || '',
              } : null
            } : null,
            parents: student.parents || [] // Add parents data to student.student structure
          }
        }));
        
        setStudents(students);
        setPagination(
          response_data.data?.pagination || {
            current: 1,
            total: 0,
            count: 0,
            limit: pageSize,
          }
        );
      } else {
        console.error("Failed to fetch students");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (student?: Student) => {
    // Reset the filtered classrooms and selected grade
    setFilteredClassRooms([]);
    setSelectedGradeId("");

    if (student) {
      // Store the student data safely
      let editingStudent = {...student};
      
      // Get detailed student data from API for editing
      try {
        console.log("Fetching detailed student data for edit");
        const response = await fetch(`/api/users/students/${student.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const detailedData = await response.json();
          console.log("Detailed student data:", detailedData);
          
          // Extract the classroom ID early to ensure we have it
          const apiClassroomId = detailedData.student?.student?.classRoomId || (detailedData.student as any).classRoomId || "";
          console.log("API provided classroom ID:", apiClassroomId);
          
          if (detailedData.data) {
            // Merge the detailed data with the existing data
            editingStudent = {
              ...editingStudent,
              ...detailedData.data,
              // Explicitly copy the fields that might be only at top level
              bloodGroup: detailedData.data.bloodGroup || detailedData.data.student?.bloodGroup || "",
              rollNumber: detailedData.data.rollNumber || detailedData.data.student?.rollNumber || "",
              emergencyContact: detailedData.data.emergencyContact || detailedData.data.student?.emergencyContact || "",
              // Explicitly set classroom ID at the top level
              classRoomId: apiClassroomId,
              // Keep the nested structure
              student: {
                ...editingStudent.student,
                ...detailedData.data.student,
                // Also ensure these fields exist in the nested structure
                bloodGroup: detailedData.student.bloodGroup || detailedData.student.student?.bloodGroup || "",
                rollNumber: detailedData.student.rollNumber || detailedData.student.student?.rollNumber || "",
                emergencyContact: detailedData.student.emergencyContact || detailedData.student.student?.emergencyContact || "",
                classRoomId: apiClassroomId // Ensure classroom ID is also in nested structure
              }
            };
          }
        } else {
          console.error("Failed to fetch detailed student data");
        }
      } catch (error) {
        console.error("Error fetching detailed student data:", error);
      }
      
      setSelectedStudent(editingStudent);
      
      // Reset parent relations
      setParentRelations([]);
      
      // If the student has parents, load their relations with relationship types
      if ((editingStudent as any).parents && (editingStudent as any).parents.length > 0) {
        const parentRelations = (editingStudent as any).parents.map((p: any) => ({
          parentId: p.id,
          relationship: p.relationship || 'Father' // Default to Father if no relationship specified
        }));
        console.log("Found parent relations:", parentRelations);
        setParentRelations(parentRelations);
      }
      
      // If we have a student to edit, find their classroom and set the grade
      // Get the classroom ID, checking multiple possible locations in the data structure
      const studentClassroomId = 
        editingStudent.student?.classRoomId || 
        (editingStudent as any).classRoomId || 
        (editingStudent as any).classId || 
        undefined;
      
      console.log("Student classroom ID for finding classroom:", studentClassroomId);
      const studentClassroom = studentClassroomId ? classRooms.find(cr => cr.id === studentClassroomId) : null;
      
      if (studentClassroom) {
        console.log("Found classroom directly:", studentClassroom);
        
        // Set the grade level ID - this will trigger filtering of classrooms
        setSelectedGradeId(studentClassroom.gradeLevelId);
        
        // For editing, show all classrooms of the same grade level
        const filtered = classRooms.filter(classroom => 
          classroom.gradeLevelId === studentClassroom.gradeLevelId
        );
        setFilteredClassRooms(filtered);
        
        // Make sure the form data explicitly includes the classroom ID
        setTimeout(() => {
          // Handle possible undefined value by providing a fallback
          // Only set if we have a valid classroom ID
          if (studentClassroomId) {
            console.log("Setting classroom ID in form data:", studentClassroomId);
            setFormData(prev => ({...prev, classRoomId: studentClassroomId}));
          } else {
            console.log("No valid classroom ID found to set in form");
          }
        }, 10);
      } else {
        console.log("Student classroom not found directly, fetching additional data");
        
        // Additional approach if we can't find the classroom directly
        const fetchStudentClassroom = async () => {
          try {
                // Get the actual grade name, which might be in different formats or properties
                const getActualGradeName = () => {
                  // First check if we can extract it from classroom grade level
                  if (editingStudent.student?.classRoom?.gradeLevel?.name) {
                    return editingStudent.student.classRoom.gradeLevel.name;
                  }
                  // Otherwise use the grade property (which might be just the name)
                  return editingStudent.grade || "";
                };
                
                const actualGradeName = getActualGradeName();
                if (actualGradeName) {
                  console.log("Searching grade level by name:", actualGradeName);
                  const matchingGradeLevel = gradeLevels.find(gl => 
                    gl.name === actualGradeName || gl.nameAr === actualGradeName
                  );
                  
                  if (matchingGradeLevel) {
                    console.log("Found matching grade level:", matchingGradeLevel);
                    setSelectedGradeId(matchingGradeLevel.id);
                    
                    // Filter classrooms by this grade - don't filter by capacity for edit mode
                    const filtered = classRooms.filter(classroom => 
                      classroom.gradeLevelId === matchingGradeLevel.id
                    );
                    setFilteredClassRooms(filtered);
                    
                    // Try to find the specific classroom by section if available
                    if (editingStudent.section) {
                      const matchingClassroom = filtered.find(cr => cr.section === editingStudent.section);
                      if (matchingClassroom) {
                        console.log("Found matching classroom by section:", matchingClassroom);
                        
                        // We need to wait for the state to update and then set the classroom ID
                        setTimeout(() => {
                          // Ensure we handle undefined values properly
                          if (matchingClassroom && matchingClassroom.id) {
                            console.log("Setting matching classroom ID in form data:", matchingClassroom.id);
                            setFormData(prev => ({...prev, classRoomId: matchingClassroom.id}));
                          } else {
                            console.log("No valid matching classroom found to set in form");
                          }
                        }, 0);
                      }
                    }
              }
            }
          } catch (error) {
            console.error("Error finding student classroom:", error);
          }
        };
        
        fetchStudentClassroom();
      }
      
      // Get the date values, accounting for different possible sources
      const dateOfBirth = editingStudent.dateOfBirth || editingStudent.student?.dateOfBirth || "";
      const admissionDate = editingStudent.admissionDate || editingStudent.student?.admissionDate || "";
      
      // Prepare formatted dates for the form
      const formattedDateOfBirth = dateOfBirth 
        ? new Date(dateOfBirth).toISOString().split("T")[0]
        : "";
        
      const formattedAdmissionDate = admissionDate
        ? new Date(admissionDate).toISOString().split("T")[0]
        : "";
      
      // If we have a classroom but no classroom ID, try to find a match by grade/section
      const classRoomIdToUse = editingStudent.student?.classRoomId || "";
      
      // Log the student object to see its structure
      console.log("Student data for edit form:", editingStudent);
      console.log("Student data nested - bloodGroup:", editingStudent.student?.bloodGroup);
      console.log("Student data nested - rollNumber:", editingStudent.student?.rollNumber);
      console.log("Student data nested - emergencyContact:", editingStudent.student?.emergencyContact);
      
      // Initialize form data with all available information
      // Log all possible sources of our key fields
      console.log("Setting form data with the following values:");
      console.log("Blood Group from top level:", editingStudent.bloodGroup);
      console.log("Blood Group from nested:", editingStudent.student?.bloodGroup);
      console.log("Roll Number from top level:", editingStudent.rollNumber);
      console.log("Roll Number from nested:", editingStudent.student?.rollNumber);
      console.log("Emergency Contact from top level:", editingStudent.emergencyContact);
      console.log("Emergency Contact from nested:", editingStudent.student?.emergencyContact);
      
      // Let's create a direct call to make sure these fields are set in the form
      const bloodGroupToUse = editingStudent.bloodGroup || editingStudent.student?.bloodGroup || "";
      const rollNumberToUse = editingStudent.rollNumber || editingStudent.student?.rollNumber || "";
      const emergencyContactToUse = editingStudent.emergencyContact || editingStudent.student?.emergencyContact || "";
      
      console.log("Final values being used:");
      console.log("bloodGroupToUse:", bloodGroupToUse);
      console.log("rollNumberToUse:", rollNumberToUse);
      console.log("emergencyContactToUse:", emergencyContactToUse);
      
      // Use direct API response approach
      try {
        // Get the detailed data directly from API and use it immediately
        const response = await fetch(`/api/users/students/${editingStudent.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const apiData = await response.json();
          console.log("Direct API data for form:", apiData);
          
          // Extract fields directly from API response
          const directBloodGroup = apiData.student.bloodGroup || apiData.student.student?.bloodGroup || "";
          const directRollNumber = apiData.student.rollNumber || apiData.student.student?.rollNumber || "";
          const directEmergencyContact = apiData.student.emergencyContact || apiData.student.student?.emergencyContact || "";
          // Get the classroom ID directly from API data
          const directClassroomId = apiData.student.student?.classRoomId || (apiData.student as any).classRoomId || "";
          
          console.log("Direct API values:", {
            bloodGroup: directBloodGroup,
            rollNumber: directRollNumber,
            emergencyContact: directEmergencyContact,
            classRoomId: directClassroomId
          });
          
          // Form data using direct API values
          // Log classroom ID before setting form data
          console.log("About to set form data with classroom ID:", directClassroomId);
          
          setFormData({
            firstName: editingStudent.user.firstName,
            lastName: editingStudent.user.lastName,
            email: editingStudent.user.email,
            phoneNumber: editingStudent.user.phone || "", 
            address: editingStudent.user.address || "",
            studentId: editingStudent.studentId,
            // Use the direct classroom ID from API
            classRoomId: directClassroomId,
            
            // Use direct API values
            rollNumber: directRollNumber,
            dateOfBirth: formattedDateOfBirth,
            bloodGroup: directBloodGroup,
            emergencyContact: directEmergencyContact,
            admissionDate: formattedAdmissionDate,
            guardianName: editingStudent.guardianName || "",
            guardianPhone: editingStudent.guardianPhone || "",
          });

          // Reset react-hook-form with the same data
          reset({
            firstName: editingStudent.user.firstName,
            lastName: editingStudent.user.lastName,
            email: editingStudent.user.email,
            phoneNumber: editingStudent.user.phone || "",
            address: editingStudent.user.address || "",
            studentId: editingStudent.studentId,
            classRoomId: directClassroomId,
            rollNumber: directRollNumber,
            dateOfBirth: formattedDateOfBirth,
            bloodGroup: directBloodGroup,
            emergencyContact: directEmergencyContact,
            admissionDate: formattedAdmissionDate,
            guardianName: editingStudent.guardianName || "",
            guardianPhone: editingStudent.guardianPhone || "",
          });
          
          // Initialize parent relations from API data
          if (apiData.student.parents && apiData.student.parents.length > 0) {
            const relations = apiData.student.parents.map((parentRel: any) => ({
              parentId: parentRel.parent.userId,
              relationship: parentRel.relationship
            }));
            setParentRelations(relations);
          } else {
            setParentRelations([]);
          }
          
          // If we have a valid classroom ID, also update the grade and filtered classrooms
          if (directClassroomId) {
            // Find the classroom object to get its grade level ID
            const classroom = classRooms.find(cr => cr.id === directClassroomId);
            if (classroom) {
              console.log("Found classroom for direct classroomId:", classroom);
              
              // Set the grade level ID
              setSelectedGradeId(classroom.gradeLevelId);
              
              // Filter classrooms by this grade level
              const filtered = classRooms.filter(cr => cr.gradeLevelId === classroom.gradeLevelId);
              setFilteredClassRooms(filtered);
            }
          }
        } else {
          // Fallback to previously computed values
          setFormData({
            firstName: editingStudent.user.firstName,
            lastName: editingStudent.user.lastName,
            email: editingStudent.user.email,
            phoneNumber: editingStudent.user.phone || "",
            address: editingStudent.user.address || "",
            studentId: editingStudent.studentId,
            classRoomId: classRoomIdToUse,
            
            rollNumber: rollNumberToUse,
            dateOfBirth: formattedDateOfBirth,
            bloodGroup: bloodGroupToUse,
            emergencyContact: emergencyContactToUse,
            admissionDate: formattedAdmissionDate,
            guardianName: editingStudent.guardianName || "",
            guardianPhone: editingStudent.guardianPhone || "",
          });

          // Reset react-hook-form with fallback values
          reset({
            firstName: editingStudent.user.firstName,
            lastName: editingStudent.user.lastName,
            email: editingStudent.user.email,
            phoneNumber: editingStudent.user.phone || "",
            address: editingStudent.user.address || "",
            studentId: editingStudent.studentId,
            classRoomId: classRoomIdToUse,
            rollNumber: rollNumberToUse,
            dateOfBirth: formattedDateOfBirth,
            bloodGroup: bloodGroupToUse,
            emergencyContact: emergencyContactToUse,
            admissionDate: formattedAdmissionDate,
            guardianName: editingStudent.guardianName || "",
            guardianPhone: editingStudent.guardianPhone || "",
          });
        }
      } catch (error) {
        console.error("Error fetching direct API data for form:", error);
        
        // Get classroom ID directly from the student object - be more thorough in checking all possible locations
        const fallbackClassroomId = editingStudent.student?.classRoomId || 
                                   (editingStudent as any).classRoomId || 
                                   "";
        console.log("Using fallback classroom ID:", fallbackClassroomId);
        
        // Fallback to previously computed values
        setFormData({
          firstName: editingStudent.user.firstName,
          lastName: editingStudent.user.lastName,
          email: editingStudent.user.email,
          phoneNumber: editingStudent.user.phone || "",
          address: editingStudent.user.address || "",
          studentId: editingStudent.studentId,
          classRoomId: fallbackClassroomId, // Make sure classroom ID is included
          
          rollNumber: rollNumberToUse,
          dateOfBirth: formattedDateOfBirth,
          bloodGroup: bloodGroupToUse,
          emergencyContact: emergencyContactToUse,
          admissionDate: formattedAdmissionDate,
          guardianName: editingStudent.guardianName || "",
          guardianPhone: editingStudent.guardianPhone || "",
        });

        // Reset react-hook-form with fallback values
        reset({
          firstName: editingStudent.user.firstName,
          lastName: editingStudent.user.lastName,
          email: editingStudent.user.email,
          phoneNumber: editingStudent.user.phone || "",
          address: editingStudent.user.address || "",
          studentId: editingStudent.studentId,
          classRoomId: fallbackClassroomId,
          rollNumber: rollNumberToUse,
          dateOfBirth: formattedDateOfBirth,
          bloodGroup: bloodGroupToUse,
          emergencyContact: emergencyContactToUse,
          admissionDate: formattedAdmissionDate,
          guardianName: editingStudent.guardianName || "",
          guardianPhone: editingStudent.guardianPhone || "",
        });
        
        // If we have a valid classroom ID, also update the grade and filtered classrooms
        if (fallbackClassroomId) {
          // Find the classroom object to get its grade level ID
          const classroom = classRooms.find(cr => cr.id === fallbackClassroomId);
          if (classroom) {
            console.log("Found classroom for fallback classroomId:", classroom);
            
            // Set the grade level ID
            setSelectedGradeId(classroom.gradeLevelId);
            
            // Filter classrooms by this grade level
            const filtered = classRooms.filter(cr => cr.gradeLevelId === classroom.gradeLevelId);
            setFilteredClassRooms(filtered);
          }
        }
      }
      
      // Double-check what's actually in the form data
      console.log("Form data after setting:", {
        rollNumber: rollNumberToUse,
        bloodGroup: bloodGroupToUse,
        emergencyContact: emergencyContactToUse
      });
    } else {
      setSelectedStudent(null);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        studentId: "",
        classRoomId: "",
        rollNumber: "",
        dateOfBirth: "",
        bloodGroup: "",
        emergencyContact: "",
        admissionDate: "",
        guardianName: "",
        guardianPhone: "",
      });
      // Reset react-hook-form to default values
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        studentId: "",
        classRoomId: "",
        rollNumber: "",
        dateOfBirth: "",
        bloodGroup: "",
        emergencyContact: "",
        admissionDate: "",
        guardianName: "",
        guardianPhone: "",
      });
      setParentRelations([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setFilteredClassRooms([]);
    setSelectedGradeId("");
    // Reset react-hook-form
    reset();
  };

  const handleFormSubmit = async (data: StudentFormData) => {
    try {
      const url = selectedStudent
        ? `/api/users/students/${selectedStudent.id}`
        : "/api/users/students";

      const method = selectedStudent ? "PATCH" : "POST";  // Changed PUT to PATCH to match the API implementation

      // Prepare request data with validated form data
      const requestData = {
        ...data,
        // Map phoneNumber to phone for API compatibility
        phone: data.phoneNumber,
        // Only include parentRelations if we're updating an existing student
        ...(selectedStudent ? { parentRelations: parentRelations } : {})
      };

      // Remove phoneNumber from request data since API expects 'phone'
      delete (requestData as any).phoneNumber;
      
      // Remove confirmPassword as it's not needed in the API
      delete (requestData as any).confirmPassword;
      
      // For updates, only include password if it's provided
      if (selectedStudent && !requestData.password?.trim()) {
        delete (requestData as any).password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        fetchStudents(pagination.current);
        handleCloseDialog();
      } else {
        console.error("Failed to save student");
      }
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        const response = await fetch(`/api/users/students/${studentId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchStudents(pagination.current);
        } else {
          console.error("Failed to delete student");
        }
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  const toggleStudentStatus = async (
    studentId: string,
    currentStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  ) => {
    try {
      const response = await fetch(`/api/users/students/${studentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
      });

      if (response.ok) {
        fetchStudents(pagination.current);
      } else {
        console.error("Failed to toggle student status");
      }
    } catch (error) {
      console.error("Error toggling student status:", error);
    }
  };

  const handleBulkAction = async (
    action: "activate" | "deactivate" | "delete"
  ) => {
    if (selectedIds.length === 0) return;

    const confirmMessage =
      action === "delete"
        ? `Are you sure you want to delete ${selectedIds.length} student(s)?`
        : `Are you sure you want to ${action} ${selectedIds.length} student(s)?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch("/api/users/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          userIds: selectedIds,
        }),
      });

      if (response.ok) {
        setSelectedIds([]);
        fetchStudents(pagination.current);
      } else {
        console.error(`Failed to ${action} students`);
      }
    } catch (error) {
      console.error(`Error ${action} students:`, error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(students.map((student) => student.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleViewStudent = (student: Student) => {
    setViewStudent(student);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewStudent(null);
  };
  
  // Export single student details to CSV
  const exportStudentDetailsToCSV = () => {
    if (!viewStudent) return;
    
    const studentName = `${viewStudent.user.firstName}_${viewStudent.user.lastName}`;
    const headers = [
      t('users.firstName'),
      t('users.lastName'),
      t('users.email'),
      t('students.phone'),
      t('students.address'),
      t('users.status'),
      t('students.studentId'),
      t('students.gradeLevel'),
      t('students.section'),
      t('students.classroom'),
      t('students.rollNumber'),
      t('academic.academicYear'),
      t('students.dateOfBirth'),
      t('students.bloodGroup'),
      t('students.admissionDate'),
      t('students.parentName'),
      t('students.emergencyContact'),
    ];
    
    const studentData = [
      viewStudent.user.firstName,
      viewStudent.user.lastName,
      viewStudent.user.email,
      viewStudent.user.phone || '',
      viewStudent.user.address || '',
      viewStudent.user.status === 'ACTIVE' ? t('common.active') : t('common.inactive'),
      viewStudent.studentId,
      viewStudent.grade || (viewStudent.student?.classRoom?.gradeLevel ? (isRTL ? viewStudent.student.classRoom.gradeLevel.nameAr : viewStudent.student.classRoom.gradeLevel.name) : ''),
      viewStudent.section || (viewStudent.student?.classRoom ? viewStudent.student.classRoom.section : ''),
      viewStudent.student?.classRoom ? (isRTL ? viewStudent.student.classRoom.nameAr : viewStudent.student.classRoom.name) : '',
      viewStudent.student?.rollNumber || '',
      viewStudent.academicYear || (viewStudent.student?.classRoom ? viewStudent.student.classRoom.academicYear : ''),
      viewStudent.dateOfBirth ? new Date(viewStudent.dateOfBirth).toLocaleDateString(locale, dateFormatOptions) : (viewStudent.student?.dateOfBirth ? new Date(viewStudent.student.dateOfBirth).toLocaleDateString(locale, dateFormatOptions) : ''),
      viewStudent.bloodGroup || viewStudent.student?.bloodGroup || '',
      viewStudent.admissionDate ? new Date(viewStudent.admissionDate).toLocaleDateString(locale, dateFormatOptions) : (viewStudent.student?.admissionDate ? new Date(viewStudent.student.admissionDate).toLocaleDateString(locale, dateFormatOptions) : ''),
      viewStudent.guardianName || '',
      viewStudent.emergencyContact || viewStudent.student?.emergencyContact || viewStudent.guardianPhone || '',
    ];
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      studentData.map(cell => `\"${cell}\"`).join(',')
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `student_${studentName}_${viewStudent.studentId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPagination((prev) => ({ ...prev, current: value }));
    fetchStudents(value);
  };

  const handlePageSizeChange = (event: any) => {
    const newPageSize = parseInt(event.target.value);
    setPageSize(newPageSize);
    setPagination((prev) => ({ ...prev, current: 1, limit: newPageSize }));
  };

  // Print student details
  const printStudentDetails = () => {
    if (!viewStudent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const studentName = `${viewStudent.user.firstName} ${viewStudent.user.lastName}`;
    const studentId = viewStudent.studentId;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('students.studentDetails')} - ${studentName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .section-title { color: #1976d2; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #555; margin-bottom: 4px; }
            .value { }
            .blood-group { 
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .parent-box {
              border: 1px solid #eee;
              border-radius: 5px;
              padding: 10px;
              margin-bottom: 10px;
            }
            .parent-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              border-bottom: 1px dashed #eee;
              padding-bottom: 5px;
            }
            .relationship {
              color: #1976d2;
              font-style: italic;
            }
            .school-logo {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 5px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              button { display: none; }
              .section { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-logo">${t('navigation.dashboard')}</div>
            <h1>${t('students.studentDetails')}</h1>
            <h2>${studentName} - ${studentId}</h2>
          </div>
          
          <div class="section">
            <h3 class="section-title">${t('students.personalInformation')}</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">${t('users.name')}</div>
                <div class="value">${studentName}</div>
              </div>
              <div class="info-item">
                <div class="label">${t('users.email')}</div>
                <div class="value">${viewStudent.user.email}</div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.phone')}</div>
                <div class="value">${viewStudent.user.phone || t('common.notProvided')}</div>
              </div>
              <div class="info-item">
                <div class="label">${t('users.status')}</div>
                <div class="value">${viewStudent.user.status === 'ACTIVE' ? t('common.active') : t('common.inactive')}</div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.address')}</div>
                <div class="value">${viewStudent.user.address || t('common.notProvided')}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">${t('academic.title')}</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">${t('students.studentId')}</div>
                <div class="value">${viewStudent.studentId}</div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.gradeLevel')}</div>
                <div class="value">${
                  viewStudent.grade || 
                  (viewStudent.student?.classRoom?.gradeLevel ? 
                    (isRTL ? viewStudent.student.classRoom.gradeLevel.nameAr : viewStudent.student.classRoom.gradeLevel.name) : 
                    t('common.notProvided'))
                }</div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.classroom')}</div>
                <div class="value" style="color: #1976d2; font-weight: bold;">${
                  viewStudent.student?.classRoom ? 
                  (isRTL ? viewStudent.student.classRoom.nameAr : viewStudent.student.classRoom.name) : 
                  t('common.notProvided')
                }</div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.rollNumber')}</div>
                <div class="value">${viewStudent.rollNumber || viewStudent.student?.rollNumber || t('common.notProvided')}</div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.classroom')}</div>
                <div class="value">${
                  viewStudent.student?.classRoom ? viewStudent.student.classRoom.name : t('common.notProvided')
                }</div>
              </div>
              <div class="info-item">
                <div class="label">${t('academic.academicYear')}</div>
                <div class="value">${
                  viewStudent.academicYear || 
                  (viewStudent.student?.classRoom ? viewStudent.student.classRoom.academicYear : t('common.notProvided'))
                }</div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.section')}</div>
                <div class="value">${
                  viewStudent.section || 
                  (viewStudent.student?.classRoom ? viewStudent.student.classRoom.section : t('common.notProvided'))
                }</div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.admissionDate')}</div>
                <div class="value">${
                  viewStudent.admissionDate ? 
                  new Date(viewStudent.admissionDate).toLocaleDateString(locale, dateFormatOptions) : 
                  (viewStudent.student?.admissionDate ? 
                    new Date(viewStudent.student.admissionDate).toLocaleDateString(locale, dateFormatOptions) : 
                    t('common.notProvided'))
                }</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">${t('students.medicalInformation')}</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">${t('students.dateOfBirth')}</div>
                <div class="value">${
                  viewStudent.dateOfBirth ? 
                  new Date(viewStudent.dateOfBirth).toLocaleDateString(locale, dateFormatOptions) : 
                  (viewStudent.student?.dateOfBirth ? 
                    new Date(viewStudent.student.dateOfBirth).toLocaleDateString(locale, dateFormatOptions) : 
                    t('common.notProvided'))
                }</div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.bloodGroup')}</div>
                <div class="value">
                  ${viewStudent.bloodGroup || viewStudent.student?.bloodGroup ? 
                    `<span class="blood-group">${viewStudent.bloodGroup || viewStudent.student?.bloodGroup}</span>` : 
                    t('common.notProvided')
                  }
                </div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.age')}</div>
                <div class="value">
                  ${viewStudent.dateOfBirth ? 
                    Math.floor((new Date().getTime() - new Date(viewStudent.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) + ' ' + t('students.years') :
                    (viewStudent.student?.dateOfBirth ?
                      Math.floor((new Date().getTime() - new Date(viewStudent.student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) + ' ' + t('students.years') :
                      t('common.notProvided'))
                  }
                </div>
              </div>
              <div class="info-item">
                <div class="label">${t('students.emergencyContact')}</div>
                <div class="value">${viewStudent.emergencyContact || viewStudent.guardianPhone || viewStudent.student?.emergencyContact || t('common.notProvided')}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">${t('navigation.parents')}</h3>
            ${viewStudent.parents && viewStudent.parents.length > 0 ? 
              viewStudent.parents.map((parent) => `
                <div class="parent-box">
                  <div class="parent-header">
                    <strong>${parent.name}</strong>
                    <span class="relationship">${t(`users.relationships.${parent.relationship}`, { defaultValue: parent.relationship })}</span>
                  </div>
                  <div class="info-grid">
                    <div class="info-item">
                      <div class="label">${t('users.email')}</div>
                      <div class="value">${parent.email || t('common.notProvided')}</div>
                    </div>
                    <div class="info-item">
                      <div class="label">${t('students.phone')}</div>
                      <div class="value">${parent.phone || t('common.notProvided')}</div>
                    </div>
                  </div>
                </div>
              `).join('') : 
              `<div class="info-grid">
                <div class="info-item">
                  <div class="label">${t('students.parentName')}</div>
                  <div class="value">${viewStudent.guardianName || t('common.notProvided')}</div>
                </div>
                <div class="info-item">
                  <div class="label">${t('students.emergencyContact')}</div>
                  <div class="value">${viewStudent.guardianPhone || t('common.notProvided')}</div>
                </div>
              </div>`
            }
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()">${t('common.print')}</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    // Give a moment for resources to load before printing
    setTimeout(() => printWindow.print(), 250);
  };

  const exportToCSV = () => {
    const headers = [
      t('users.name'),
      t('users.email'),
      t('students.studentId'),
      t('students.gradeLevel'),
      t('students.classroom'),
      t('students.section'), 
      t('students.parentName'),
      t('students.emergencyContact'),
      t('students.bloodGroup'),
      t('students.status'),
      t('students.admissionDate'),
    ];
    const rows = students.map((student) => [
      `${student.user.firstName} ${student.user.lastName}`,
      student.user.email,
      student.studentId,
      isRTL ? (student.student?.classRoom?.gradeLevel?.nameAr || student.student?.classRoom?.gradeLevel?.name || student.grade || '') : (student.student?.classRoom?.gradeLevel?.name || student.grade || ''),
      isRTL ? (student.student?.classRoom?.nameAr || student.student?.classRoom?.name || '') : (student.student?.classRoom?.name || ''),
      student.section || '',
      student.guardianName || '',
      student.emergencyContact || student.student?.emergencyContact || student.guardianPhone || '',
      student.bloodGroup || (student.student?.bloodGroup || ''),
      student.user.status === 'ACTIVE' ? t('common.active') : t('common.inactive'),
      student.admissionDate ? new Date(student.admissionDate).toLocaleDateString(locale, dateFormatOptions) : '',
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== "ADMIN") {
    return (
      <SidebarLayout>
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </SidebarLayout>
    );
  }

  // Define table columns
  const columns: Column[] = [
    {
      key: 'user.firstName',
      label: t('users.name'),
      render: (value, row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      key: 'password',
      label: t('students.password'),
      render: (value, row) => {
        // Only show password for admins
        if (user?.role !== 'ADMIN') {
          return '••••••••';
        }
        // Decrypt and show the actual password
        const encryptedPassword = row.user?.password || '';
        if (!encryptedPassword) return 'Not set';
        return decryptPassword(encryptedPassword);
      },
    },
    {
      key: 'studentId',
      label: t('students.studentId'),
    },
    {
      key: 'student.classRoom.gradeLevel.name',
      label: t('students.gradeLevel'),
      render: (value, row) => {
        const gradeName = isRTL 
          ? row.student?.classRoom?.gradeLevel?.nameAr || row.student?.classRoom?.gradeLevel?.name 
          : row.student?.classRoom?.gradeLevel?.name || row.grade;
        return gradeName || '';
      },
    },
    {
      key: 'student.classRoom.name',
      label: t('students.classroom'),
      render: (value, row) => {
        const classroomName = isRTL 
          ? row.student?.classRoom?.nameAr || row.student?.classRoom?.name 
          : row.student?.classRoom?.name || row.section;
        return classroomName || '';
      },
    },
    {
      key: 'parents',
      label: t('students.parentName'),
      render: (value: any, row: any) => {
        if (row.parents && row.parents.length > 0) {
          return row.parents.map((p: { id: string; name: string; email: string; phone?: string; relationship: string }) => p.name).join(', ');
        }
        return row.guardianName || t('common.notProvided');
      },
    },
    {
      key: 'user.status',
      label: t('students.status'),
    },
    {
      key: 'admissionDate',
      label: t('students.admissionDate'),
      render: (value, row) => {
        return value ? new Date(value).toLocaleDateString(locale, dateFormatOptions) : '';
      },
    },
  ];

  // Define table actions
  const actions: Action[] = [
    {
      key: 'view',
      label: t('common.viewDetails'),
      icon: <Visibility />,
      onClick: (row) => handleViewStudent(row),
    },
    {
      key: 'edit',
      label: t('students.editStudent'),
      icon: <Edit />,
      onClick: (row) => handleOpenDialog(row),
    },
    {
      key: 'toggleStatus',
      label: row => row.user.status === 'ACTIVE' ? t('common.deactivate') : t('common.activate'),
      icon: row => row.user.status === 'ACTIVE' ? <Block /> : <CheckCircle />,
      onClick: (row) => toggleStudentStatus(row.id, row.user.status),
      color: row => row.user.status === 'ACTIVE' ? 'warning' : 'success',
    },
    {
      key: 'delete',
      label: t('common.delete'),
      icon: <Delete />,
      onClick: (row) => handleDelete(row.id),
      color: 'error',
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: 'status',
      label: t('students.filterByStatus'),
      type: 'select',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: t('students.allStatus') },
        { value: 'active', label: t('students.active') },
        { value: 'inactive', label: t('students.inactive') },
      ],
    },
    {
      key: 'grade',
      label: t('students.filterByGrade'),
      type: 'select',
      value: gradeFilter,
      onChange: setGradeFilter,
      options: [
        { value: 'all', label: t('students.allGrades') },
        ...(gradeLevels?.map((grade) => ({
          value: grade.id,
          label: isRTL ? grade.nameAr : grade.name,
        })) || []),
      ],
    },
  ];

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'activate',
      label: t('students.activate'),
      icon: <CheckCircle />,
      onClick: () => handleBulkAction('activate'),
      color: 'success',
    },
    {
      key: 'deactivate',
      label: t('students.deactivate'),
      icon: <Block />,
      onClick: () => handleBulkAction('deactivate'),
      color: 'warning',
    },
    {
      key: 'delete',
      label: t('students.delete'),
      icon: <Delete />,
      onClick: () => handleBulkAction('delete'),
      color: 'error',
    },
  ];

  return (
    <SidebarLayout>
      <Box>
        <PageHeader
          title={t('students.title')}
          actionLabel={t('students.addStudent')}
          actionIcon={<PersonAdd />}
          onAction={() => handleOpenDialog()}
        />

        <FilterPanel
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('students.searchStudents')}
          filters={filters}
          onSearch={() => fetchStudents(1)}
          onExport={exportToCSV}
          exportLabel={t('students.export')}
          bulkActions={bulkActions}
          selectedCount={selectedIds.length}
        />

        <DataTable
          columns={columns}
          data={students}
          actions={actions}
          loading={loading}
          emptyMessage={t('students.studentsList')}
          selectable={true}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          avatarIcon={<School />}
          avatarField="user.firstName"
          subtitleField="user.email"
        />

        <PaginationControls
          current={pagination.current}
          total={pagination.total}
          limit={pageSize}
          onPageChange={(page) => {
            setPagination(prev => ({ ...prev, current: page }));
            fetchStudents(page);
          }}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPagination(prev => ({ ...prev, current: 1, limit: newPageSize }));
          }}
        />

        {/* Add/Edit Student Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedStudent ? t('students.editStudent') : t('students.addStudent')}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Box display="flex" gap={2}>
                <TextField
                  label={t('students.firstName')}
                  {...register('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  fullWidth
                  required
                />
                <TextField
                  label={t('students.lastName')}
                  {...register('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label={t('students.email')}
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
                required
              />
              {!selectedStudent && (
                <>
                  <TextField
                    label={t('students.password')}
                    type="password"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    fullWidth
                    required={!selectedStudent}
                  />
                  <TextField
                    label={t('students.confirmPassword')}
                    type="password"
                    {...register('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    fullWidth
                    required={!selectedStudent}
                  />
                </>
              )}
              {selectedStudent && user?.role === 'ADMIN' && (
                <>
                  <TextField
                    label={t('students.password')}
                    type="password"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    fullWidth
                    placeholder="Leave empty to keep current password"
                  />
                  {watch('password') && (
                    <TextField
                      label={t('students.confirmPassword')}
                      type="password"
                      {...register('confirmPassword')}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      fullWidth
                    />
                  )}
                </>
              )}
              <Box display="flex" gap={2}>
                <TextField
                  label={t('students.phone')}
                  {...register('phoneNumber')}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message}
                  fullWidth
                />
                <TextField
                  label={t('students.studentId')}
                  {...register('studentId')}
                  error={!!errors.studentId}
                  helperText={errors.studentId?.message}
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label={t('students.address')}
                {...register('address')}
                error={!!errors.address}
                helperText={errors.address?.message}
                fullWidth
                multiline
                rows={2}
              />
              <Box display="flex" gap={2}>
                <TextField
                  label={t('students.gradeLevel')}
                  select
                  {...register('classRoomId')} // We'll use classRoomId for validation since grade is just a filter
                  value={selectedGradeId || ""}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: loadingGradeLevels && (
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', paddingRight: 1 }}>
                          <CircularProgress size={20} />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="">{t('students.selectGradeLevel')}</MenuItem>
                  {gradeLevels && gradeLevels.length > 0 ? gradeLevels.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>
                      {isRTL ? grade.nameAr : grade.name}
                    </MenuItem>
                  )) : null}
                </TextField>
                <TextField
                  label={t('students.classroom')}
                  select
                  {...register('classRoomId')}
                  error={!!errors.classRoomId}
                  helperText={
                    errors.classRoomId?.message ||
                    (selectedGradeId && filteredClassRooms && filteredClassRooms.length === 0
                      ? t('students.noClassrooms')
                      : selectedStudent && !selectedGradeId
                      ? t('students.pleaseSelectGrade')
                      : "")
                  }
                  onChange={(e) => {
                    console.log("Classroom dropdown changed to:", e.target.value);
                    setValue('classRoomId', e.target.value);
                    setFormData({ ...formData, classRoomId: e.target.value });
                  }}
                  fullWidth
                  required
                  disabled={!selectedGradeId}
                  InputProps={{
                    endAdornment: loadingClassrooms && (
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', paddingRight: 1 }}>
                          <CircularProgress size={20} />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                >
                  {(() => {
                    // Debug classroom dropdown population
                    console.log("Classroom dropdown render state:", {
                      selectedClassroom: formData.classRoomId,
                      filteredRooms: filteredClassRooms?.map(r => ({id: r.id, name: r.name}))
                    });
                    
                    return filteredClassRooms && filteredClassRooms.length > 0 ? filteredClassRooms.map((classroom) => (
                      <MenuItem key={classroom.id} value={classroom.id}>
                        {isRTL ? classroom.nameAr : classroom.name} ({t('students.available')}: {classroom.capacity - classroom._count.students}/{classroom.capacity})
                        {formData.classRoomId === classroom.id ? " ✓" : ""}
                      </MenuItem>
                    )) : null;
                  })()}
                </TextField>
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  label={t('students.rollNumber')}
                  {...register('rollNumber')}
                  error={!!errors.rollNumber}
                  helperText={errors.rollNumber?.message}
                  fullWidth
                />
                <TextField
                  label={t('students.bloodGroup')}
                  select
                  {...register('bloodGroup')}
                  error={!!errors.bloodGroup}
                  helperText={errors.bloodGroup?.message}
                  fullWidth
                >
                  <MenuItem value="">{t('common.select')} {t('students.bloodGroup')}</MenuItem>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((blood) => (
                    <MenuItem key={blood} value={blood}>
                      {blood}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
  
              {/* Parent Relations Management */}
              <Box mt={2}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" color="primary" fontWeight="bold" mb={1}>
                  {t('students.parentRelations')}
                </Typography>
                <ParentStudentRelationManager
                  mode="student"
                  currentId={selectedStudent?.id || ''}
                  selectedRelations={parentRelations}
                  onRelationsChange={(relations) => {
                    const convertedRelations = relations.map(rel => ({
                      parentId: rel.parentId!,
                      relationship: rel.relationship
                    }));
                    setParentRelations(convertedRelations);
                  }}
                />
              </Box>
              
              <Box display="flex" gap={2}>
                {/* Clarified emergency contact label */}
                <TextField
                  label={t('students.emergencyContact')}
                  {...register('emergencyContact')}
                  error={!!errors.emergencyContact}
                  helperText={errors.emergencyContact?.message || t('students.emergencyContactHint')}
                  fullWidth
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  label={t('students.dateOfBirth')}
                  type="date"
                  {...register('dateOfBirth')}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth?.message}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label={t('students.admissionDate')}
                  type="date"
                  {...register('admissionDate')}
                  error={!!errors.admissionDate}
                  helperText={errors.admissionDate?.message}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit(handleFormSubmit)} variant="contained">
              {selectedStudent ? t('common.update') : t('common.add')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Student Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={handleCloseViewDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar>
                <School />
              </Avatar>
              {t('students.studentDetails')}
            </Box>
          </DialogTitle>
          <DialogContent>
            {viewStudent && (
              <Box display="flex" flexDirection="column" gap={3} mt={2}>
                {/* Personal Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('students.title')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.firstName')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.user.firstName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.lastName')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.user.lastName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.email')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.user.email}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.status')}
                      </Typography>
                      <Chip
                        label={
                          viewStudent.user.status === 'ACTIVE' ? t('students.active') : 
                          viewStudent.user.status === 'INACTIVE' ? t('students.inactive') : 
                          t('students.suspended')
                        }
                        color={viewStudent.user.status === 'ACTIVE' ? "success" : 
                               viewStudent.user.status === 'INACTIVE' ? "error" : "warning"}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.phone')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.user.phone || t('common.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.address')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.user.address || t('common.notProvided')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Academic Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('academic.title')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.studentId')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.studentId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.rollNumber')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.student?.rollNumber || t('common.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.gradeLevel')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.grade || (viewStudent.student?.classRoom?.gradeLevel?.name ? 
                        (isRTL ? viewStudent.student.classRoom.gradeLevel.nameAr : viewStudent.student.classRoom.gradeLevel.name) : 
                        t('common.notProvided'))}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.section')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.section || (viewStudent.student?.classRoom ? viewStudent.student.classRoom.section : t('common.notProvided'))}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.classroom')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        {viewStudent.student?.classRoom ? 
                         (isRTL ? viewStudent.student.classRoom.nameAr : viewStudent.student.classRoom.name) : 
                         t('common.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('academic.academicYear')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.academicYear || (viewStudent.student?.classRoom ? viewStudent.student.classRoom.academicYear : t('common.notProvided'))}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.admissionDate')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.admissionDate ? new Date(viewStudent.admissionDate).toLocaleDateString(
                          locale,
                          dateFormatOptions
                        ) : viewStudent.student?.admissionDate ? new Date(viewStudent.student.admissionDate).toLocaleDateString(
                          locale,
                          dateFormatOptions
                        ) : t('common.notProvided')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
                
                {/* Medical Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('students.medicalInformation')}
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.dateOfBirth')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.dateOfBirth ? new Date(viewStudent.dateOfBirth).toLocaleDateString(
                          locale,
                          dateFormatOptions
                        ) : viewStudent.student?.dateOfBirth ? new Date(viewStudent.student.dateOfBirth).toLocaleDateString(
                          locale,
                          dateFormatOptions
                        ) : t('common.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.bloodGroup')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {(viewStudent.bloodGroup || viewStudent.student?.bloodGroup) ? (
                          <Chip 
                            label={viewStudent.bloodGroup || viewStudent.student?.bloodGroup}
                            color={
                              (viewStudent.bloodGroup || viewStudent.student?.bloodGroup)?.includes('A') ? "primary" :
                              (viewStudent.bloodGroup || viewStudent.student?.bloodGroup)?.includes('B') ? "secondary" :
                              (viewStudent.bloodGroup || viewStudent.student?.bloodGroup)?.includes('AB') ? "info" : "error"
                            }
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : t('common.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.age')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.dateOfBirth ? 
                          Math.floor((new Date().getTime() - new Date(viewStudent.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) + ' ' + t('students.years') :
                          viewStudent.student?.dateOfBirth ?
                          Math.floor((new Date().getTime() - new Date(viewStudent.student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) + ' ' + t('students.years') :
                          t('common.notProvided')
                        }
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('students.emergencyContact')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewStudent.emergencyContact || viewStudent.student?.emergencyContact || viewStudent.guardianPhone || t('common.notProvided')}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Allergies & Medical Conditions - We'll display these if they're added to the schema in the future */}
                  <Box mt={2} sx={{ opacity: 0.7 }}>
                    <Typography variant="body2" fontStyle="italic" color="text.secondary">
                      {t('students.additionalMedicalInfo')}
                    </Typography>
                  </Box>
                </Paper>

                {/* Guardian/Parent Information */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {t('navigation.parents')}
                  </Typography>
                  
                  {/* Check if there are parents in the relation */}
                  {viewStudent.parents && viewStudent.parents.length > 0 ? (
                    <Box>
                      {viewStudent.parents.map((parent, index) => (
                        <Box
                          key={parent.id}
                          sx={{
                            p: 1.5,
                            mb: index < (viewStudent.parents?.length || 0) - 1 ? 2 : 0,
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Box display="flex" alignItems="center" mb={1} gap={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {parent.name.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {parent.name}
                            </Typography>
                            <Chip 
                              label={t(`users.relationships.${parent.relationship}`, { defaultValue: parent.relationship })} 
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ ml: 'auto' }}
                            />
                          </Box>
                          
                          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {t('users.email')}
                              </Typography>
                              <Typography variant="body1">
                                {parent.email || t('common.notProvided')}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {t('students.phone')}
                              </Typography>
                              <Typography variant="body1">
                                {parent.phone || t('common.notProvided')}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('students.parentName')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {viewStudent.guardianName || t('common.notProvided')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('students.emergencyContact')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {viewStudent.guardianPhone || viewStudent.student?.emergencyContact || t('common.notProvided')}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 3, pb: 2 }}>
            <Box>
              <Button 
                onClick={handleCloseViewDialog} 
                color="inherit" 
                variant="outlined"
              >
                {t('common.close')}
              </Button>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                onClick={exportStudentDetailsToCSV}
                startIcon={<GetApp />}
                color="secondary"
                variant="outlined"
                size="small"
              >
                {t('common.export')}
              </Button>
              <Button
                onClick={printStudentDetails}
                startIcon={<Print />}
                color="primary"
                variant="outlined"
                size="small"
              >
                {t('common.print')}
              </Button>
              <Button
                onClick={() => {
                  handleCloseViewDialog();
                  if (viewStudent) handleOpenDialog(viewStudent);
                }}
                variant="contained"
                startIcon={<Edit />}
              >
                {t('students.editStudent')}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
