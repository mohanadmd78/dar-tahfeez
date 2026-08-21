import { createClient } from '@supabase/supabase-js';

// تحذير: هذا الملف يُستخدم فقط في مكونات السيرفر (server components) أو مسارات API
// (route.ts). لا تستورده أبدًا داخل ملف عليه توجيه 'use client'، لأن المفتاح هنا
// يتجاوز كل قواعد الحماية (RLS) بالكامل.
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false }
  });
}
