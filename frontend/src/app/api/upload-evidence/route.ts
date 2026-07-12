import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file received.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = Date.now() + "_" + file.name.replaceAll(' ', '_');
    const uploadDir = path.join(process.cwd(), 'uploads/evidence');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    // Return the relative path so the frontend can serve it
    // The frontend should have a route to serve files from /uploads
    const relativeUrl = `/api/evidence-files/${filename}`;

    return NextResponse.json({ url: relativeUrl, filepath: filepath });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
  }
}
