// Quick script to verify RLS fix was applied
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyRLSFix() {
  console.log('🔍 Проверка применения RLS миграции...\n');
  
  // Check if helper function exists
  console.log('1. Проверка функции user_has_board_access...');
  try {
    const { data, error } = await supabase.rpc('user_has_board_access', {
      board_uuid: '00000000-0000-0000-0000-000000000000',
      user_uuid: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('function')) {
        console.log('   ❌ Функция user_has_board_access не найдена');
        console.log('   → Миграция не применена или применена не полностью');
      } else {
        console.log(`   ⚠️  Ошибка: ${error.message}`);
      }
    } else {
      console.log('   ✅ Функция user_has_board_access существует');
    }
  } catch (err: any) {
    console.log(`   ⚠️  ${err.message}`);
  }
  
  // Try to query boards
  console.log('\n2. Проверка доступа к таблице boards...');
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('infinite recursion')) {
        console.log('   ❌ RLS рекурсия все еще присутствует');
        console.log('   → Примените миграцию ФИНАЛЬНАЯ_МИГРАЦИЯ_RLS.sql');
      } else {
        console.log(`   ⚠️  Ошибка: ${error.message}`);
        console.log('   → Это может быть нормально (нет данных или нет доступа)');
      }
    } else {
      console.log('   ✅ Доступ к boards работает (нет ошибки рекурсии)');
    }
  } catch (err: any) {
    console.log(`   ⚠️  ${err.message}`);
  }
  
  // Check board_members
  console.log('\n3. Проверка доступа к таблице board_members...');
  try {
    const { data, error } = await supabase
      .from('board_members')
      .select('board_id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('infinite recursion')) {
        console.log('   ❌ RLS рекурсия все еще присутствует');
      } else {
        console.log(`   ⚠️  Ошибка: ${error.message}`);
        console.log('   → Это может быть нормально (нет данных или нет доступа)');
      }
    } else {
      console.log('   ✅ Доступ к board_members работает');
    }
  } catch (err: any) {
    console.log(`   ⚠️  ${err.message}`);
  }
  
  console.log('\n✅ Проверка завершена');
}

verifyRLSFix().catch(console.error);
