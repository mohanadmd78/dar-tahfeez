'use client';
import { useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AppShell from '@/components/AppShell';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default function ScanPage() {
  const supabase = supabaseBrowser();
  const [mode, setMode] = useState<'presence' | 'profile'>('presence');
  const [resultMsg, setResultMsg] = useState<{ type: 'ok' | 'danger'; text: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const scannerRef = useRef<any>(null);
  const lastScanRef = useRef(0);

  useEffect(() => {
    let instance: any;
    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      instance = new Html5Qrcode('qrReader');
      scannerRef.current = instance;
      try {
        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (decodedText: string) => onScan(decodedText),
          () => {}
        );
      } catch (err: any) {
        setResultMsg({ type: 'danger', text: 'تعذّر تشغيل الكاميرا: ' + err });
      }
    })();
    return () => {
      instance?.stop?.().then(() => instance.clear()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onScan(qrValue: string) {
    const now = Date.now();
    if (now - lastScanRef.current < 2500) return;
    lastScanRef.current = now;

    const idMatch = qrValue.match(/STU-(\d+)/);
    if (!idMatch) {
      setResultMsg({ type: 'danger', text: 'رمز غير معروف' });
      return;
    }
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('student_number', Number(idMatch[1]))
      .maybeSingle();

    if (!student) {
      setResultMsg({ type: 'danger', text: 'رمز غير معروف' });
      return;
    }

    if (mode === 'presence') {
      await supabase
        .from('daily_logs')
        .upsert({ log_date: todayStr(), student_id: student.id, attendance: 'حاضر' }, { onConflict: 'log_date,student_id' });
      setResultMsg({ type: 'ok', text: 'تم تسجيل حضور: ' + student.full_name });
    } else {
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('student_id', student.id)
        .neq('attendance', 'غياب المحفّظ')
        .order('log_date', { ascending: true });
      setProfile({ student, logs: logs || [] });
    }
  }

  function stats(logs: any[]) {
    const total = logs.length;
    const pct = (pred: (l: any) => boolean) => (total === 0 ? 0 : Math.round((logs.filter(pred).length / total) * 100));
    return {
      attendanceRate: pct((l) => l.attendance === 'حاضر'),
      asr: pct((l) => l.asr === 'حاضر'),
      maghrib: pct((l) => l.maghrib === 'حاضر'),
      isha: pct((l) => l.isha === 'حاضر'),
      total
    };
  }

  return (
    <AppShell>
      <div className="card">
        <h2 className="font-heading font-bold text-base text-primarydark mb-3.5">مسح رمز الطالب</h2>
        <div className="flex gap-2.5 mb-3.5">
          <button
            className={mode === 'presence' ? 'btn' : 'btn-ghost btn'}
            onClick={() => {
              setMode('presence');
              setProfile(null);
              setResultMsg(null);
            }}
          >
            تسجيل حضور سريع
          </button>
          <button
            className={mode === 'profile' ? 'btn' : 'btn-ghost btn'}
            onClick={() => {
              setMode('profile');
              setResultMsg(null);
            }}
          >
            استعراض سجل الطالب
          </button>
        </div>

        <div id="qrReader" className="max-w-[420px] mx-auto" />

        {resultMsg && (
          <div className={`mt-3.5 badge ${resultMsg.type === 'ok' ? 'badge-ok' : 'badge-danger'}`}>{resultMsg.text}</div>
        )}

        {profile && (
          <div className="mt-4 border-t border-line pt-4">
            <h3 className="font-heading font-bold text-primarydark mb-3">سجل الطالب: {profile.student.full_name}</h3>
            {profile.logs.length === 0 ? (
              <div className="text-inksoft text-sm">لا توجد سجلات لهذا الطالب بعد</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(() => {
                  const s = stats(profile.logs);
                  return (
                    <>
                      <div className="card !p-3 text-center">
                        <div className="font-heading font-extrabold text-xl text-primarydark">{s.attendanceRate}%</div>
                        <div className="text-[11px] text-inksoft">نسبة الحضور</div>
                      </div>
                      <div className="card !p-3 text-center">
                        <div className="font-heading font-extrabold text-xl text-primarydark">{s.asr}%</div>
                        <div className="text-[11px] text-inksoft">العصر</div>
                      </div>
                      <div className="card !p-3 text-center">
                        <div className="font-heading font-extrabold text-xl text-primarydark">{s.maghrib}%</div>
                        <div className="text-[11px] text-inksoft">المغرب</div>
                      </div>
                      <div className="card !p-3 text-center">
                        <div className="font-heading font-extrabold text-xl text-primarydark">{s.isha}%</div>
                        <div className="text-[11px] text-inksoft">العشاء</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
