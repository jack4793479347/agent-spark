import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { checkRateLimit, rateLimitKey } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rl = checkRateLimit(rateLimitKey(auth.user.id, 'scrape'), 10);
    if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are supported' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the page
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AgentSpark/1.0 (Knowledge Base Importer)',
          'Accept': 'text/html,application/xhtml+xml,text/plain,*/*',
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out' }, { status: 408 });
      }
      return NextResponse.json({ error: 'Could not reach the website' }, { status: 502 });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ error: `Website returned ${response.status}` }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || '';
    const html = await response.text();

    // Extract text content from HTML
    let text = html;

    if (contentType.includes('html')) {
      // Remove script, style, nav, footer, header tags and their content
      text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
      text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
      text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
      text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');
      text = text.replace(/<header[\s\S]*?<\/header>/gi, '');
      text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
      text = text.replace(/<svg[\s\S]*?<\/svg>/gi, '');

      // Convert common block elements to newlines
      text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote|section|article)[^>]*>/gi, '\n');

      // Remove all remaining HTML tags
      text = text.replace(/<[^>]+>/g, '');

      // Decode common HTML entities
      text = text.replace(/&amp;/g, '&');
      text = text.replace(/&lt;/g, '<');
      text = text.replace(/&gt;/g, '>');
      text = text.replace(/&quot;/g, '"');
      text = text.replace(/&#39;/g, "'");
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/&#\d+;/g, '');
      text = text.replace(/&\w+;/g, '');
    }

    // Clean up whitespace
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.trim();

    // Truncate if too large (500KB max)
    const maxLen = 500 * 1024;
    if (text.length > maxLen) {
      text = text.slice(0, maxLen) + '\n\n[Content truncated]';
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : parsedUrl.hostname;

    return NextResponse.json({
      success: true,
      title,
      url: parsedUrl.toString(),
      content: text,
      length: text.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 });
  }
}
