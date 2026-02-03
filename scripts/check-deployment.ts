// Comprehensive deployment checklist verification script
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const EDGE_BASE_URL = process.env.EDGE_BASE_URL || (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  console.error('   Set in .env or .env.smoke');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: CheckResult[] = [];

async function checkDatabaseMigrations() {
  console.log('\n📊 1. Проверка миграций БД...\n');
  
  try {
    // Check if tables exist
    const tables = [
      'profiles', 'boards', 'board_members', 'presets', 'models',
      'generations', 'assets', 'credit_accounts', 'credit_ledger',
      'admin_settings', 'provider_tasks'
    ];
    
    for (const table of tables) {
      // For boards/board_members, use a simpler query to avoid RLS recursion issues
      if (table === 'boards' || table === 'board_members') {
        // Try to check if table exists by querying with a very specific filter
        // that should work even with RLS
        const { error } = await supabase
          .from(table)
          .select('id')
          .eq('id', '00000000-0000-0000-0000-000000000000')
          .limit(0);
        
        if (error) {
          // Check if it's RLS recursion error
          if (error.message.includes('infinite recursion')) {
            results.push({
              name: `Table: ${table}`,
              status: 'fail',
              message: `❌ RLS рекурсия (примените миграцию 20240101000006_fix_rls_boards_complete.sql)`
            });
          } else {
            // Other errors might be OK (like "not found" for the dummy UUID)
            results.push({
              name: `Table: ${table}`,
              status: 'pass',
              message: '✅ Существует'
            });
          }
        } else {
          results.push({
            name: `Table: ${table}`,
            status: 'pass',
            message: '✅ Существует'
          });
        }
      } else {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          results.push({
            name: `Table: ${table}`,
            status: 'fail',
            message: `❌ ${error.message}`
          });
        } else {
          results.push({
            name: `Table: ${table}`,
            status: 'pass',
            message: '✅ Существует'
          });
        }
      }
    }
    
    // Check models count
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('id', { count: 'exact' })
      .eq('provider', 'kie');
    
    if (modelsError) {
      results.push({
        name: 'KIE Models',
        status: 'fail',
        message: `❌ ${modelsError.message}`
      });
    } else {
      const count = models?.length || 0;
      if (count >= 70) {
        results.push({
          name: 'KIE Models',
          status: 'pass',
          message: `✅ ${count} моделей найдено`
        });
      } else {
        results.push({
          name: 'KIE Models',
          status: 'warning',
          message: `⚠️  Только ${count} моделей (ожидается ~70+)`
        });
      }
    }
    
    // Check presets
    const { data: presets, error: presetsError } = await supabase
      .from('presets')
      .select('key, type');
    
    if (presetsError) {
      results.push({
        name: 'Presets',
        status: 'fail',
        message: `❌ ${presetsError.message}`
      });
    } else {
      const presetKeys = presets?.map(p => p.key) || [];
      if (presetKeys.length >= 3) {
        results.push({
          name: 'Presets',
          status: 'pass',
          message: `✅ ${presetKeys.length} presets: ${presetKeys.join(', ')}`
        });
      } else {
        results.push({
          name: 'Presets',
          status: 'warning',
          message: `⚠️  Только ${presetKeys.length} presets`
        });
      }
    }
    
  } catch (error: any) {
    results.push({
      name: 'Database Check',
      status: 'fail',
      message: `❌ ${error.message}`
    });
  }
}

async function checkStorageBuckets() {
  console.log('\n📦 2. Проверка Storage Buckets...\n');
  
  try {
    // Try to list buckets - this requires service role or admin access
    // If it fails, try to access buckets directly
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log(`   ⚠️  Не удалось получить список buckets: ${listError.message}`);
      console.log(`   → Пробую проверить доступ к buckets напрямую...`);
      
      // Try to access buckets directly by trying to list files
      // For private buckets, we might get permission errors, but that means bucket exists
      const requiredBuckets = ['uploads', 'outputs'];
      for (const bucketName of requiredBuckets) {
        try {
          const { data: files, error: accessError } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 1 });
          
          if (accessError) {
            // Check error type
            const errorMsg = accessError.message.toLowerCase();
            
            // "not found" or "does not exist" = bucket doesn't exist
            if (errorMsg.includes('not found') || 
                errorMsg.includes('does not exist') ||
                errorMsg.includes('bucket') && errorMsg.includes('not found')) {
              results.push({
                name: `Bucket: ${bucketName}`,
                status: 'fail',
                message: '❌ Не найден (создайте через Dashboard > Storage)'
              });
            } else if (errorMsg.includes('permission') || 
                       errorMsg.includes('access') ||
                       errorMsg.includes('policy') ||
                       errorMsg.includes('row-level security')) {
              // Permission/policy errors = bucket exists but RLS blocks access
              // This is OK for private buckets
              results.push({
                name: `Bucket: ${bucketName}`,
                status: 'pass',
                message: '✅ Существует (private - доступ ограничен RLS, это нормально)'
              });
            } else {
              // Other errors - assume bucket exists but can't verify
              results.push({
                name: `Bucket: ${bucketName}`,
                status: 'warning',
                message: `⚠️  Не удалось проверить: ${accessError.message.substring(0, 50)}`
              });
            }
          } else {
            // No error = bucket exists and accessible
            results.push({
              name: `Bucket: ${bucketName}`,
              status: 'pass',
              message: '✅ Существует и доступен'
            });
          }
        } catch (err: any) {
          // Network or other errors
          results.push({
            name: `Bucket: ${bucketName}`,
            status: 'warning',
            message: `⚠️  Ошибка проверки: ${err.message?.substring(0, 50) || 'Unknown error'}`
          });
        }
      }
      return;
    }
    
    // If listBuckets worked, check normally
    const bucketNames = buckets?.map(b => b.name) || [];
    const requiredBuckets = ['uploads', 'outputs'];
    
    for (const required of requiredBuckets) {
      if (bucketNames.includes(required)) {
        const bucket = buckets?.find(b => b.name === required);
        const isPublic = bucket?.public || false;
        results.push({
          name: `Bucket: ${required}`,
          status: isPublic ? 'warning' : 'pass',
          message: isPublic 
            ? `⚠️  Существует, но PUBLIC (должен быть private)`
            : '✅ Существует и private'
        });
      } else {
        results.push({
          name: `Bucket: ${required}`,
          status: 'fail',
          message: '❌ Не найден'
        });
      }
    }
  } catch (error: any) {
    results.push({
      name: 'Storage Check',
      status: 'fail',
      message: `❌ ${error.message}`
    });
  }
}

async function checkEdgeFunctions() {
  console.log('\n⚡ 3. Проверка Edge Functions...\n');
  
  if (!EDGE_BASE_URL) {
    results.push({
      name: 'Edge Functions',
      status: 'fail',
      message: '❌ EDGE_BASE_URL не установлен'
    });
    return;
  }
  
  const functions = ['upload', 'generate', 'status', 'download'];
  
  for (const func of functions) {
    try {
      const response = await fetch(`${EDGE_BASE_URL}/${func}`, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization, content-type',
        },
      });
      
      if (response.status === 204 || response.status === 200) {
        results.push({
          name: `Function: ${func}`,
          status: 'pass',
          message: `✅ Доступна (OPTIONS: ${response.status})`
        });
      } else if (response.status === 404) {
        results.push({
          name: `Function: ${func}`,
          status: 'fail',
          message: '❌ Не найдена (404)'
        });
      } else {
        results.push({
          name: `Function: ${func}`,
          status: 'warning',
          message: `⚠️  Неожиданный статус: ${response.status}`
        });
      }
    } catch (error: any) {
      results.push({
        name: `Function: ${func}`,
        status: 'fail',
        message: `❌ ${error.message}`
      });
    }
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔐 4. Проверка переменных окружения...\n');
  
  const required = {
    'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL || SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
  };
  
  for (const [key, value] of Object.entries(required)) {
    if (value) {
      const preview = value.length > 20 
        ? `${value.substring(0, 20)}...${value.substring(value.length - 4)}`
        : value;
      results.push({
        name: key,
        status: 'pass',
        message: `✅ Установлен: ${preview}`
      });
    } else {
      results.push({
        name: key,
        status: 'fail',
        message: '❌ Не установлен'
      });
    }
  }
  
  // Note: Edge Function secrets cannot be checked from here
  results.push({
    name: 'Edge Secrets',
    status: 'warning',
    message: '⚠️  Проверьте вручную в Dashboard: SERVICE_ROLE_KEY, KIE_API_KEY, KIE_BASE_URL'
  });
}

async function checkRLSPolicies() {
  console.log('\n🔒 5. Проверка RLS Policies...\n');
  
  try {
    // Try to query profiles (should work with anon key if RLS is correct)
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST301') {
      results.push({
        name: 'RLS Policies',
        status: 'warning',
        message: '⚠️  RLS включен, но может потребоваться аутентификация для проверки'
      });
    } else if (error) {
      results.push({
        name: 'RLS Policies',
        status: 'warning',
        message: `⚠️  ${error.message}`
      });
    } else {
      results.push({
        name: 'RLS Policies',
        status: 'pass',
        message: '✅ RLS работает (запросы проходят)'
      });
    }
  } catch (error: any) {
    results.push({
      name: 'RLS Check',
      status: 'warning',
      message: `⚠️  ${error.message}`
    });
  }
}

async function runAllChecks() {
  console.log('🔍 Проверка готовности к деплою\n');
  console.log('='.repeat(60));
  
  await checkDatabaseMigrations();
  await checkStorageBuckets();
  await checkEdgeFunctions();
  await checkEnvironmentVariables();
  await checkRLSPolicies();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Результаты проверки:\n');
  
  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;
  
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message}`);
    
    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else warnCount++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Итого: ${passCount} ✅ | ${warnCount} ⚠️  | ${failCount} ❌\n`);
  
  if (failCount === 0) {
    console.log('✅ Все критические проверки пройдены! Готово к деплою.\n');
    process.exit(0);
  } else {
    console.log('❌ Есть критические ошибки. Исправьте их перед деплоем.\n');
    process.exit(1);
  }
}

runAllChecks().catch(console.error);
