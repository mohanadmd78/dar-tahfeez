-- ============================================================
-- مخطط قاعدة بيانات نظام دار التحفيظ (Supabase / Postgres)
-- شغّل هذا الملف كاملاً مرة واحدة من: Supabase Dashboard > SQL Editor > New query
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- جدول الطلاب ----------
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  student_number serial unique,
  full_name text not null,
  phone text,
  registered_at date not null default current_date,
  qr_value text generated always as ('STU-' || student_number) stored,
  status text not null default 'نشط',
  created_at timestamptz not null default now()
);

-- ---------- جدول السجل اليومي ----------
create table if not exists daily_logs (
  id uuid primary key default uuid_generate_v4(),
  log_date date not null,
  student_id uuid not null references students(id) on delete cascade,
  attendance text check (attendance in ('حاضر','غائب','غياب المحفّظ')),
  asr text check (asr in ('حاضر','غائب')),
  maghrib text check (maghrib in ('حاضر','غائب')),
  isha text check (isha in ('حاضر','غائب')),
  new_amount text,
  new_grade text check (new_grade in ('ممتاز','جيد جدًا','جيد','ضعيف')),
  review_amount text,
  review_grade text check (review_grade in ('ممتاز','جيد جدًا','جيد','ضعيف')),
  behavior text check (behavior in ('ممتاز','جيد','يحتاج تحسين')),
  notes text,
  created_at timestamptz not null default now(),
  unique (log_date, student_id)
);

-- ---------- جدول أيام التعطيل ----------
create table if not exists days_off (
  log_date date primary key,
  reason text default 'تعطيل / غياب المحفّظ',
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_logs_date on daily_logs(log_date);
create index if not exists idx_daily_logs_student on daily_logs(student_id);

-- ============================================================
-- الحماية (RLS) — هذا هو الجزء الأهم أمنيًا
-- القاعدة: لا وصول إطلاقًا إلا لمستخدم مسجّل دخول عبر Supabase Auth.
-- بما أنك ستنشئ حساب المسؤول الوحيد يدويًا ولن تفعّل التسجيل العام،
-- فإن اشتراط "authenticated" يكفي فعليًا كحماية كاملة للنظام.
-- ============================================================

alter table students enable row level security;
alter table daily_logs enable row level security;
alter table days_off enable row level security;

create policy "authenticated_full_access_students"
  on students for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_full_access_daily_logs"
  on daily_logs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_full_access_days_off"
  on days_off for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- دالة مساعدة: تعطيل يوم كامل (تُنشئ سجل "غياب المحفّظ" لكل الطلاب النشطين)
-- ============================================================
create or replace function set_day_off(p_date date, p_reason text default 'تعطيل يدوي')
returns void
language plpgsql
security definer
as $$
begin
  insert into days_off (log_date, reason) values (p_date, p_reason)
  on conflict (log_date) do nothing;

  insert into daily_logs (log_date, student_id, attendance, notes)
  select p_date, id, 'غياب المحفّظ', 'تعطيل تلقائي لليوم'
  from students
  where status = 'نشط'
  on conflict (log_date, student_id)
  do update set attendance = 'غياب المحفّظ', notes = 'تعطيل تلقائي لليوم',
    asr = null, maghrib = null, isha = null, new_amount = null, new_grade = null,
    review_amount = null, review_grade = null, behavior = null;
end;
$$;

create or replace function unset_day_off(p_date date)
returns void
language plpgsql
security definer
as $$
begin
  delete from days_off where log_date = p_date;
end;
$$;
