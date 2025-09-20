import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.formData();
    const files: File[] = data.getAll('files') as unknown as File[];
    const uploadType = data.get('type') as string || 'general'; // 'assignments', 'chat', 'general'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedFiles = [];

    // Create uploads directory based on type
    const subDir = uploadType === 'assignments' ? 'assignments' : 
                   uploadType === 'chat' ? 'chat' : 'general';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    for (const file of files) {
      if (file.size === 0) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(file.name);
      const fileName = `${timestamp}-${randomString}${extension}`;
      const filePath = path.join(uploadsDir, fileName);

      await writeFile(filePath, buffer);

      uploadedFiles.push({
        originalName: file.name,
        fileName: fileName,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: `/uploads/${subDir}/${fileName}`
      });
    }

    return NextResponse.json({ 
      message: 'Files uploaded successfully', 
      files: uploadedFiles 
    });

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'assignments', fileName);

    try {
      await import('fs/promises').then(fs => fs.unlink(filePath));
      return NextResponse.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}