import fs from 'fs';
import path from 'path';
import prisma from '@/libs/prisma';
import { NextRequest, NextResponse } from 'next/server';

// This helper converts a Node.js ReadStream into a web ReadableStream
function createReadableStreamFromNodeStream(nodeStream: fs.ReadStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', chunk => {
        controller.enqueue(chunk); // Push data to the stream
      });

      nodeStream.on('end', () => {
        controller.close(); // Close the stream when the Node.js stream ends
      });

      nodeStream.on('error', err => {
        controller.error(err); // Handle error in the Node.js stream
      });
    },

    cancel() {
      nodeStream.destroy(); // Ensure the Node.js stream is destroyed if cancelled
    }
  });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const batchId = parseInt(params.id);

  // Validate batch ID
  if (isNaN(batchId)) {
    return NextResponse.json({ message: 'Invalid batch ID' }, { status: 400 });
  }

  // Find the job in the database
  const job = await prisma.jobs.findFirst({
    where: {
      reference_id: batchId,
      reference_type: 'batch',
      job_type: 'generate_zip',
      status: 'completed',
    },
    select: {
      id: true,
      file_path: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // If the job does not exist, return an error
  if (!job) {
    return NextResponse.json(
      { message: 'No completed zip generation job found for this batch' },
      { status: 404 }
    );
  }

  const zipPath = job.file_path;

  // If the file path is not found in the job record, return an error
  if (!zipPath) {
    return NextResponse.json(
      { message: 'Zip file path not found in job record' },
      { status: 404 }
    );
  }

  // Check if the file exists
  if (!fs.existsSync(zipPath)) {
    return NextResponse.json({ message: 'Zip file not found' }, { status: 404 });
  }

  const state = fs.statSync(zipPath);
  const fileName = path.basename(zipPath); // Dynamically extract file name from path

  // Create a readable stream from the file
  const fileStream = fs.createReadStream(zipPath);

  // Convert Node.js ReadStream to Web ReadableStream
  const webReadableStream = createReadableStreamFromNodeStream(fileStream);

  // Set the headers to inform the browser that it's a file download
  const headers = {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${fileName}"`, // Correct filename in header
    'Content-Length': state.size.toString(), // Provide the correct content length
    'Accept-Ranges': 'bytes', // Enable range requests for resuming downloads
  };

  return new NextResponse(webReadableStream, { headers });
}
