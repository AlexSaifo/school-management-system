import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SlotType } from '@prisma/client';

// POST /api/timetable/generate - Generate automatic timetable for a class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId } = body;

    if (!classId) {
      return NextResponse.json(
        { success: false, error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Get class details with grade level
    const classDetails = await prisma.classRoom.findUnique({
      where: { id: classId },
      include: {
        gradeLevel: {
          include: {
            gradeSubjects: {
              include: {
                subject: {
                  include: {
                    teacherSubjects: {
                      include: {
                        teacher: true
                      },
                      where: {
                        isPrimary: true
                      },
                      take: 1
                    }
                  }
                }
              },
              where: {
                isRequired: true
              }
            }
          }
        }
      }
    });

    if (!classDetails) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Get lesson time slots (exclude breaks, lunch, assembly)
    const lessonTimeSlots = await prisma.timeSlot.findMany({
      where: {
        slotType: 'LESSON',
        isActive: true
      },
      orderBy: { slotOrder: 'asc' }
    });

    // Get available rooms (use classroom IDs for regular lessons)
    const availableRooms = await prisma.classRoom.findMany({
      where: {
        isActive: true
      },
      take: 5 // Use first 5 classrooms
    });

    // Clear existing timetable for this class
    await prisma.timetable.deleteMany({
      where: { classRoomId: classId }
    });

    // Create weekly schedule distribution
    const daysOfWeek = [0, 1, 2, 3, 4]; // Sunday to Thursday (5 days)
    const totalLessonSlots = daysOfWeek.length * lessonTimeSlots.length;
    
    // Prepare subjects with required weekly hours
    const subjectsToSchedule: Array<{
      subject: any;
      teacher: any;
      weeklyHours: number;
      scheduledHours: number;
    }> = classDetails.gradeLevel.gradeSubjects.map((gs: any) => ({
      subject: gs.subject,
      teacher: gs.subject.teacherSubjects[0]?.teacher || null,
      weeklyHours: gs.weeklyHours,
      scheduledHours: 0
    }));

    // Calculate total required hours
    const totalRequiredHours = subjectsToSchedule.reduce((sum, s) => sum + s.weeklyHours, 0);
    
    if (totalRequiredHours > totalLessonSlots) {
      return NextResponse.json(
        { success: false, error: `Not enough time slots. Required: ${totalRequiredHours}, Available: ${totalLessonSlots}` },
        { status: 400 }
      );
    }

    // Schedule subjects across the week
    let timetableEntries: Array<{
      classRoomId: string;
      timeSlotId: string;
      dayOfWeek: number;
      subjectId: string;
      teacherId: string | null;
      specialLocationId: string | null;
      slotType: SlotType;
    }> = [];

    let slotIndex = 0;
    
    // First pass: Schedule required hours for each subject
    for (const subjectData of subjectsToSchedule) {
      let hoursToSchedule = subjectData.weeklyHours;
      
      while (hoursToSchedule > 0 && slotIndex < totalLessonSlots) {
        const dayIndex = Math.floor(slotIndex / lessonTimeSlots.length);
        const timeSlotIndex = slotIndex % lessonTimeSlots.length;
        const dayOfWeek = daysOfWeek[dayIndex];
        const timeSlot = lessonTimeSlots[timeSlotIndex];
        
        // Check for teacher conflicts (both within this generation and globally)
        let hasConflict = timetableEntries.some(entry => 
          entry.teacherId === subjectData.teacher?.id &&
          entry.dayOfWeek === dayOfWeek &&
          entry.timeSlotId === timeSlot.id
        );

        // Also check for global teacher conflicts in database
        if (!hasConflict && subjectData.teacher?.id) {
          const existingConflicts = await prisma.timetable.findFirst({
            where: {
              teacherId: subjectData.teacher.id,
              dayOfWeek: dayOfWeek,
              timeSlotId: timeSlot.id,
              isActive: true,
              classRoomId: { not: classId }
            }
          });
          hasConflict = !!existingConflicts;
        }

        if (!hasConflict) {
          timetableEntries.push({
            classRoomId: classId,
            timeSlotId: timeSlot.id,
            dayOfWeek: dayOfWeek,
            subjectId: subjectData.subject.id,
            teacherId: subjectData.teacher?.id || null,
            specialLocationId: availableRooms[Math.floor(Math.random() * availableRooms.length)]?.id || null,
            slotType: SlotType.LESSON
          });
          
          hoursToSchedule--;
          subjectData.scheduledHours++;
        }
        
        slotIndex++;
      }
    }

    // Second pass: Fill remaining slots with popular subjects (Arabic, Math, Science)
    const popularSubjects = subjectsToSchedule.filter(s => 
      ['AR', 'MATH', 'SCI', 'PHY', 'CHEM', 'BIO'].includes(s.subject.code)
    );

    while (timetableEntries.length < Math.min(totalLessonSlots, totalRequiredHours)) {
      const dayIndex = Math.floor(slotIndex / lessonTimeSlots.length);
      const timeSlotIndex = slotIndex % lessonTimeSlots.length;
      
      if (dayIndex >= daysOfWeek.length) break;
      
      const dayOfWeek = daysOfWeek[dayIndex];
      const timeSlot = lessonTimeSlots[timeSlotIndex];
      
      // Check if this slot is already filled
      const existingEntry = timetableEntries.find(entry =>
        entry.dayOfWeek === dayOfWeek && entry.timeSlotId === timeSlot.id
      );
      
      if (!existingEntry && popularSubjects.length > 0) {
        const randomSubject = popularSubjects[Math.floor(Math.random() * popularSubjects.length)];
        
        // Check for teacher conflicts (both within this generation and globally)
        let hasConflict = timetableEntries.some(entry => 
          entry.teacherId === randomSubject.teacher?.id &&
          entry.dayOfWeek === dayOfWeek &&
          entry.timeSlotId === timeSlot.id
        );

        // Also check for global teacher conflicts in database
        if (!hasConflict && randomSubject.teacher?.id) {
          const existingConflicts = await prisma.timetable.findFirst({
            where: {
              teacherId: randomSubject.teacher.id,
              dayOfWeek: dayOfWeek,
              timeSlotId: timeSlot.id,
              isActive: true,
              classRoomId: { not: classId }
            }
          });
          hasConflict = !!existingConflicts;
        }

        if (!hasConflict) {
          timetableEntries.push({
            classRoomId: classId,
            timeSlotId: timeSlot.id,
            dayOfWeek: dayOfWeek,
            subjectId: randomSubject.subject.id,
            teacherId: randomSubject.teacher?.id || null,
            specialLocationId: availableRooms[Math.floor(Math.random() * availableRooms.length)]?.id || null,
            slotType: SlotType.LESSON
          });
        }
      }
      
      slotIndex++;
    }

    // Save timetable entries to database
    const createdEntries = await prisma.$transaction(
      timetableEntries.map(entry => 
        prisma.timetable.create({ data: entry })
      )
    );

    // Add non-lesson slots (breaks, lunch, assembly)
    const nonLessonSlots = await prisma.timeSlot.findMany({
      where: {
        slotType: { not: 'LESSON' },
        isActive: true
      }
    });

    const nonLessonEntries = [];
    for (const day of daysOfWeek) {
      for (const slot of nonLessonSlots) {
        nonLessonEntries.push({
          classRoomId: classId,
          timeSlotId: slot.id,
          dayOfWeek: day,
          subjectId: null,
          teacherId: null,
          specialLocationId: null,
          slotType: slot.slotType,
          isActive: true
        });
      }
    }

    if (nonLessonEntries.length > 0) {
      await prisma.$transaction(
        nonLessonEntries.map(entry => 
          prisma.timetable.create({ data: entry })
        )
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Timetable generated successfully for ${classDetails.nameAr}`,
        entriesCreated: createdEntries.length + nonLessonEntries.length,
        subjectsScheduled: subjectsToSchedule.map(s => ({
          subject: s.subject.nameAr,
          weeklyHours: s.weeklyHours,
          scheduledHours: s.scheduledHours
        }))
      }
    });

  } catch (error) {
    console.error('Error generating timetable:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate timetable' },
      { status: 500 }
    );
  }
}
