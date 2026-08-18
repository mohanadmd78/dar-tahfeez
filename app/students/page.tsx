'use client';
import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AppShell from '@/components/AppShell';

const GRADES = ['ممتاز', 'جيد جدًا', 'جيد', 'ضعيف'];

export default function StudentsPage() {
  const supabase = supabaseBrowser();
  const [students, setStudents] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [cardStudent, setCardStudent] = useState<any>(null);
  const [memorizedInput, setMemorizedInput] = useState('');
  const [juzModalStudent, setJuzModalStudent] = useState<any>(null);
  const [juzRows, setJuzRows] = useState<any[]>([]);
  const [juzLoading, setJuzLoading] = useState(false);
  const [activeJuz, setActiveJuz] = useState<number | null>(null);
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
      setMemorizedInput(cardStudent.total_memorized || '');
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

  async function saveMemorized() {
    if (!cardStudent) return;
    const { error } = await supabase
      .from('students')
      .update({ total_memorized: memorizedInput })
      .eq('id', cardStudent.id);
    if (error) {
      alert('حدث خطأ: ' + error.message);
      return;
    }
    await load();
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
    if (!confirm('تحذير: هذا سيمسح الطالب وكل سجله اليومي (الحفظ، المراجعة، الحضور، الأجزاء) نهائيًا ولا يمكن التراجع. هل أنت متأكد؟')) return;
    if (!confirm('تأكيد أخير: هل تريد المتابعة فعليًا؟')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      alert('حدث خطأ: ' + error.message);
      return;
    }
    setCardStudent(null);
    load();
  }

  async function openJuzModal(student: any) {
    setJuzModalStudent(student);
    setJuzLoading(true);
    const { data } = await supabase
      .from('juz_tests')
      .select('*')
      .eq('student_id', student.id)
      .order('juz_number', { ascending: true });
    setJuzRows(data || []);
    setJuzLoading(false);
  }

  async function toggleJuzTested(row: any) {
    const newTested = !row.tested;
    await supabase
      .from('juz_tests')
      .update({ tested: newTested, test_date: newTested ? new Date().toISOString().slice(0, 10) : null })
      .eq('id', row.id);
    setJuzRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, tested: newTested } : r)));
  }

  async function setJuzGrade(row: any, grade: string) {
    await supabase.from('juz_tests').update({ grade }).eq('id', row.id);
    setJuzRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, grade } : r)));
  }

  const filtered = students.filter((s) => !search || s.full_name.includes(search));
  const testedCount = juzRows.filter((r) => r.tested).length;

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
                  <th className="text-right p-2">المحفوظ</th>
                  <th className="text-right p-2">الحالة</th>
                  <th className="text-right p-2"></th>
                  <th className="text-right p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-line hover:bg-primarysoft">
                    <td className="p-2 cursor-pointer" onClick={() => setCardStudent(s)}>
                      {s.student_number}
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => setCardStudent(s)}>
                      {s.full_name}
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => setCardStudent(s)}>
                      {s.phone || '—'}
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => setCardStudent(s)}>
                      {s.total_memorized || '—'}
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => setCardStudent(s)}>
                      <span className={`badge ${s.status === 'نشط' ? 'badge-ok' : 'badge-warn'}`}>{s.status}</span>
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => setCardStudent(s)}>
                      بطاقة ▸
                    </td>
                    <td className="p-2">
                      <button className="btn-ghost btn !py-1 !px-2.5 text-xs" onClick={() => openJuzModal(s)}>
                        الأجزاء
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== بطاقة الطالب ===== */}
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

            <div className="mt-4">
              <label className="label">كمية المحفوظات الإجمالية</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="مثال: 15 جزء وربع"
                  value={memorizedInput}
                  onChange={(e) => setMemorizedInput(e.target.value)}
                />
                <button className="btn !px-3.5" onClick={saveMemorized}>
                  حفظ
                </button>
              </div>
            </div>

            <button
              className="btn-ghost btn w-full mt-3"
              onClick={() => {
                setCardStudent(null);
                openJuzModal(cardStudent);
              }}
            >
              عرض / تعديل الأجزاء المُختبَرة
            </button>

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
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== شبكة الأجزاء الثلاثين ===== */}
      {juzModalStudent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setJuzModalStudent(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-[520px] max-w-full max-h-[88vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="text-inksoft text-xl mb-2" onClick={() => setJuzModalStudent(null)}>
              ✕
            </button>
            <h3 className="font-heading font-bold text-primarydark mb-1">
              أجزاء الاختبار: {juzModalStudent.full_name}
            </h3>
            <p className="text-inksoft text-xs mb-4">
              اضغط على أي جزء لتبديل حالته بين "مُختبَر" و"غير مُختبَر". دوّس التقدير إذا اختبرته.
            </p>

            {juzLoading ? (
              <div className="text-center py-8 text-inksoft text-sm">جارٍ التحميل...</div>
            ) : (
              <>
                <div className="badge badge-ok mb-3">{testedCount} / 30 جزءًا مُختبَر</div>
                <div className="grid grid-cols-5 gap-2">
                  {juzRows.map((row) => (
                    <div key={row.id} className="flex flex-col items-center">
                      <button
                        onClick={() => {
                          toggleJuzTested(row);
                          setActiveJuz(row.juz_number);
                        }}
                        className={`w-full aspect-square rounded-lg border text-sm font-bold flex items-center justify-center ${
                          row.tested ? 'bg-primarysoft border-primary text-primarydark' : 'bg-white border-line text-inksoft'
                        }`}
                        title={row.tested ? 'مُختبَر — اضغط للإلغاء' : 'غير مُختبَر — اضغط للتأكيد'}
                      >
                        {row.juz_number}
                      </button>
                      {row.tested && (
                        <select
                          className="text-[10px] border border-line rounded mt-1 w-full text-center bg-white"
                          value={row.grade || ''}
                          onChange={(e) => setJuzGrade(row, e.target.value)}
                        >
                          <option value="">—</option>
                          {GRADES.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
