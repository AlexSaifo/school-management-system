import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to convert data to CSV format
function convertToCSV(data: any[], headers: string[]): string {
  const csvHeader = headers.join(',');
  const csvData = data.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  ).join('\n');
  
  return `${csvHeader}\n${csvData}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('type') || 'admins';
    const format = searchParams.get('format') || 'csv'; // csv or json
    
    let users: any[] = [];
    let headers: string[] = [];
    let filename = '';
    
    switch (userType) {
      case 'admins':
        users = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          include: {
            admin: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        
        headers = [
          'firstName', 'lastName', 'email', 'phoneNumber', 'address',
          'department', 'position', 'dateOfJoining', 'salary', 'isActive', 'createdAt'
        ];
        
        users = users.map((user: any) => ({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          department: 'N/A', // Admins don't have departments
          position: user.admin?.permissions ? 'Admin' : '', // Use permissions as position indicator
          dateOfJoining: user.admin?.createdAt ? new Date(user.admin.createdAt).toLocaleDateString() : '',
          salary: 'N/A', // Admins don't have salary field
          isActive: user.status === 'ACTIVE' ? 'Active' : 'Inactive',
          createdAt: new Date(user.createdAt).toLocaleDateString(),
        }));
        
        filename = 'admins_export';
        break;
        
      case 'teachers':
        users = await prisma.user.findMany({
          where: { role: 'TEACHER' },
          include: {
            teacher: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        
        headers = [
          'firstName', 'lastName', 'email', 'phoneNumber', 'address',
          'employeeId', 'department', 'subject', 'qualification', 'experience', 
          'salary', 'joinDate', 'isActive', 'createdAt'
        ];
        
        users = users.map((user: any) => ({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          employeeId: user.teacher?.employeeId || '',
          department: user.teacher?.department || '',
          subject: user.teacher?.subject || '',
          qualification: user.teacher?.qualification || '',
          experience: user.teacher?.experience ? `${user.teacher.experience} years` : '',
          salary: user.teacher?.salary || '',
          joinDate: user.teacher?.joinDate ? new Date(user.teacher.joinDate).toLocaleDateString() : '',
          isActive: user.status === 'ACTIVE' ? 'Active' : 'Inactive',
          createdAt: new Date(user.createdAt).toLocaleDateString(),
        }));
        
        filename = 'teachers_export';
        break;
        
      case 'students':
        users = await prisma.user.findMany({
          where: { role: 'STUDENT' },
          include: {
            student: {
              include: {
                classRoom: true,
                parents: {
                  include: {
                    parent: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        headers = [
          'firstName', 'lastName', 'email', 'phoneNumber', 'address',
          'studentId', 'rollNumber', 'class', 'grade', 'section', 'dateOfBirth', 
          'admissionDate', 'emergencyContact', 'bloodGroup', 'parents', 'isActive', 'createdAt'
        ];
        
        users = users.map((user: any) => ({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          studentId: user.student?.studentId || '',
          rollNumber: user.student?.rollNumber || '',
          class: user.student?.classRoom?.name || '',
          grade: user.student?.classRoom?.gradeLevel?.name || '',
          section: user.student?.classRoom?.section || '',
          dateOfBirth: user.student?.dateOfBirth ? new Date(user.student.dateOfBirth).toLocaleDateString() : '',
          admissionDate: user.student?.admissionDate ? new Date(user.student.admissionDate).toLocaleDateString() : '',
          emergencyContact: user.student?.emergencyContact || '',
          bloodGroup: user.student?.bloodGroup || '',
          parents: user.student?.parents.map((sp: any) => 
            `${sp.parent.user.firstName} ${sp.parent.user.lastName} (${sp.parent.relationship})`
          ).join('; ') || '',
          isActive: user.status === 'ACTIVE' ? 'Active' : 'Inactive',
          createdAt: new Date(user.createdAt).toLocaleDateString(),
        }));
        
        filename = 'students_export';
        break;
        
      case 'parents':
        users = await prisma.user.findMany({
          where: { role: 'PARENT' },
          include: {
            parent: {
              include: {
                children: {
                  include: {
                    student: {
                      include: {
                        user: true,
                        classRoom: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        headers = [
          'firstName', 'lastName', 'email', 'phoneNumber', 'address',
          'occupation', 'relationship', 'children', 'childrenCount', 'isActive', 'createdAt'
        ];
        
        users = users.map((user: any) => ({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          occupation: user.parent?.occupation || '',
          children: user.parent?.children.map((sp: any) => 
            `${sp.student.user.firstName} ${sp.student.user.lastName} (${sp.student.classRoom?.name || 'N/A'})`
          ).join('; ') || '',
          childrenCount: user.parent?.children.length || 0,
          isActive: user.status === 'ACTIVE' ? 'Active' : 'Inactive',
          createdAt: new Date(user.createdAt).toLocaleDateString(),
        }));
        
        filename = 'parents_export';
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid user type' },
          { status: 400 }
        );
    }
    
    if (format === 'csv') {
      const csvData = convertToCSV(users, headers);
      
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // JSON format
      return new NextResponse(JSON.stringify(users, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export users' },
      { status: 500 }
    );
  }
}
