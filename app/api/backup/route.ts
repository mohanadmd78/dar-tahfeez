import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Vercel Cron يرسل هذا الترويسة تلقائيًا إذا كان متغير البيئة CRON_SECRET معرّفًا
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const [students, dailyLogs, daysOff, juzTests] = await Promise.all([
    supabase.from('students').select('*'),
    supabase.from('daily_logs').select('*'),
    supabase.from('days_off').select('*'),
    supabase.from('juz_tests').select('*')
  ]);

  const errors = [students.error, dailyLogs.error, daysOff.error, juzTests.error].filter(Boolean);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.map((e) => e?.message).join(' | ') }, { status: 500 });
  }

  const backup = {
    generated_at: new Date().toISOString(),
    students: students.data,
    daily_logs: dailyLogs.data,
    days_off: daysOff.data,
    juz_tests: juzTests.data
  };

  const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;

  const { error: uploadError } = await supabase.storage
    .from('backups')
    .upload(filename, JSON.stringify(backup, null, 2), {
      contentType: 'application/json',
      upsert: true
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, filename, students: students.data?.length ?? 0 });
}
