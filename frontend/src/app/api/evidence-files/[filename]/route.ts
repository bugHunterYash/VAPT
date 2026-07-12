import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filePath = path.join(process.cwd(), 'uploads', 'evidence', filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  
  // Basic content type detection
  let contentType = 'application/octet-stream';
  if (filename.endsWith('.png')) contentType = 'image/png';
  else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
  else if (filename.endsWith('.gif')) contentType = 'image/gif';
  else if (filename.endsWith('.webp')) contentType = 'image/webp';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
