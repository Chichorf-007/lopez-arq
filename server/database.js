const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fxdcgicxyasrboovmbwm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_f_BqO47yu0_5focPXBl7SA_ojpat60d';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initDatabase() {
  console.log('🔄 Verificando tablas y usuario administrador en Supabase...');

  try {
    const adminHash = await bcrypt.hash('admin123', 10);

    // Upsert admin maru.lopez and maru
    await supabase.from('users').upsert([
      { username: 'maru.lopez', password_hash: adminHash, name: 'Maru López', role: 'ADMIN', rate_per_hour: 0 },
      { username: 'maru', password_hash: adminHash, name: 'Maru López', role: 'ADMIN', rate_per_hour: 0 }
    ], { onConflict: 'username' });

    console.log('✅ Usuario Administrador Maru López verificado');
  } catch (err) {
    console.error('⚠️ Nota al verificar base de datos en Supabase:', err.message);
  }
}

module.exports = {
  supabase,
  initDatabase
};
