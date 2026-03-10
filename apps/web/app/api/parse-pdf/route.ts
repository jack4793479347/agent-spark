import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { getApiUser } from '@/lib/supabase/api-auth';
import { checkRateLimit, rateLimitKey } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rl = checkRateLimit(rateLimitKey(auth.user.id, 'parse-pdf'), 5);
    if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const pdf = await getDocument({ data, useSystemFonts: true }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = content.items
        .map((item: any) => item.str || '')
        .join(' ');
      if (pageText.trim()) pages.push(pageText.trim());
    }

    let text = pages.join('\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    text = text.trim();

    if (!text) {
      return NextResponse.json({ error: 'Could not extract text from PDF (may be image-based)' }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      content: text,
      pages: pdf.numPages,
      length: text.length,
    });
  } catch (e) {
    console.error('PDF parse error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
