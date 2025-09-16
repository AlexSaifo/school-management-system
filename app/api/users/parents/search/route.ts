import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Retrieve the authorization token from headers
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term') || '';
    
    if (!term) {
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }
    
    // Search for parents by name, email, occupation
    const parents = await prisma.parent.findMany({
      where: {
        OR: [
          { user: { firstName: { contains: term, mode: 'insensitive' } } },
          { user: { lastName: { contains: term, mode: 'insensitive' } } },
          { user: { email: { contains: term, mode: 'insensitive' } } },
          { occupation: { contains: term, mode: 'insensitive' } }
        ]
      },
      include: {
        user: true
      },
      take: 10, // Limit results
    });
    
    // Transform data for frontend
    const transformedParents = parents.map(parent => ({
      id: parent.userId, // Use userId instead of parent.id
      firstName: parent.user.firstName,
      lastName: parent.user.lastName,
      email: parent.user.email,
      phone: parent.user.phone,
      occupation: parent.occupation
    }));
    
    return NextResponse.json({
      success: true,
      data: transformedParents
    });
  } catch (error) {
    console.error('Error searching parents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search parents' },
      { status: 500 }
    );
  }
}