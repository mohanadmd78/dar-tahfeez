'use client';
import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AppShell from '@/components/AppShell';

export default function StudentsPage() {
  const supabase = supabaseBrowser();
  const [students, setStudents] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [cardStudent, setCardStudent] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function load() {
    const { data } = await supabase.from('students').select('*').order('student_number', { ascending: false });
    setStudents(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (cardStudent && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, cardStudent.qr_value, { width: 110, margin: 1 });
    }
  }, [cardStudent]);

  async function addStudent() {
    if (!name.trim()) {
      alert('الاسم مطلوب');
      return;
    }
    const { data, error } = await supabase
      .from('students')
      .insert({ full_name: name.trim(), phone })
      .select()
      .single();
    if (error) {
      alert('حدث خطأ: ' + error.message);
      return;
    }
    setName('');
    setPhone('');
    await load();
    setCardStudent(data);
  }

  async function deactivateStudent(id: string) {
    if (!confirm('سيصبح الطالب "غير نشط" ولن يظهر بقوائم التسجيل اليومي، لكن سجله وتاريخه سيبقى محفوظًا بالكامل. متابعة؟')) return;
    await supabase.from('students').update({ status: 'منسحب' }).eq('id', id);
    setCardStudent(null);
    load();
  }

  async function reactivateStudent(id: string) {
    await supabase.from('students').update({ status: 'نشط' }).eq('id', id);
    setCardStudent(null);
    load();
  }

  async function hardDeleteStudent(id: string) {
    if (!confirm('تحذير: هذا سيمسح الطالب وكل سجله اليومي (الحفظ، المراجعة، الحضور) نهائيًا ولا يمكن التراجع. هل أنت متأكد؟')) return;
    if (!confirm('تأكيد أخير: اكتب نعم بذهنك ثم اضغط موافق للمتابعة فعليًا.')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      alert('حدث خطأ: ' + error.message);
      return;
    }
    setCardStudent(null);
    load();
  }

  const filtered = students.filter((s) => !search || s.full_name.includes(search));

  return (
    <AppShell>
      <div className="card mb-4">
        <h2 className="font-heading font-bold text-base text-primarydark mb-3.5">إضافة طالب جديد</h2>
        <div className="flex gap-3.5 flex-wrap mb-3">
          <div className="flex-[2] min-w-[180px]">
            <label className="label">الاسم الثلاثي</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="label">رقم الهاتف</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <button className="btn" onClick={addStudent}>
          إضافة الطالب
        </button>
      </div>

      <div className="card">
        <h2 className="font-heading font-bold text-base text-primarydark mb-3.5">قائمة الطلاب</h2>
        <input
          className="input mb-3.5"
          placeholder="ابحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-inksoft text-sm">لا يوجد طلاب بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-inksoft text-xs">
                  <th className="text-right p-2">#</th>
                  <th className="text-right p-2">الاسم</th>
                  <th className="text-right p-2">الهاتف</th>
                  <th className="text-right p-2">تاريخ التسجيل</th>
                  <th className="text-right p-2">الحالة</th>
                  <th className="text-right p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-line cursor-pointer hover:bg-primarysoft"
                    onClick={() => setCardStudent(s)}
                  >
                    <td className="p-2">{s.student_number}</td>
                    <td className="p-2">{s.full_name}</td>
                    <td className="p-2">{s.phone || '—'}</td>
                    <td className="p-2">{s.registered_at}</td>
                    <td className="p-2">
                      <span className={`badge ${s.status === 'نشط' ? 'badge-ok' : 'badge-warn'}`}>{s.status}</span>
                    </td>
                    <td className="p-2">بطاقة ▸</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cardStudent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setCardStudent(null)}
        >
          <div className="bg-white rounded-2xl p-6 w-[380px] max-w-full" onClick={(e) => e.stopPropagation()}>
            <button className="text-inksoft text-xl mb-2" onClick={() => setCardStudent(null)}>
              ✕
            </button>
            <h3 className="font-heading font-bold text-primarydark mb-3.5">بطاقة الطالب</h3>
            <div className="flex justify-center">
              <div
                className="w-[300px] rounded-2xl p-5 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#0A3527,#0F4C3A)' }}
              >
                <div className="absolute inset-2 border border-gold/50 rounded-2xl pointer-events-none" />
                <div className="text-[11px] text-[#CFE3D8]">دار التحفيظ</div>
                <div className="font-heading font-extrabold text-lg mt-2">{cardStudent.full_name}</div>
                <div className="text-goldsoft text-xs tracking-wide">رقم الطالب: {cardStudent.student_number}</div>
                <div className="bg-white p-2 rounded-lg w-fit mt-3">
                  <canvas ref={canvasRef} />
                </div>
              </div>
            </div>
            <div className="text-center mt-3.5 flex gap-2 justify-center flex-wrap">
              <button className="btn btn-gold" onClick={() => window.print()}>
                طباعة
              </button>
              {cardStudent.status === 'نشط' ? (
                <button className="btn-ghost btn" onClick={() => deactivateStudent(cardStudent.id)}>
                  تعطيل (خرج من الحلقة)
                </button>
              ) : (
                <button className="btn-ghost btn" onClick={() => reactivateStudent(cardStudent.id)}>
                  إعادة تفعيل
                </button>
              )}
              <button className="btn btn-danger" onClick={() => hardDeleteStudent(cardStudent.id)}>
                حذف نهائي (يمسح كل سجله)
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
