const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fxdcgicxyasrboovmbwm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_f_BqO47yu0_5focPXBl7SA_ojpat60d';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initDatabase() {
  console.log('🔄 Verificando tablas e inicializando datos por defecto en Supabase...');

  try {
    // Check if Maru exists in users
    const { data: adminUser, error: adminErr } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'maru')
      .single();

    if (!adminUser && !adminErr?.message?.includes('Multiple')) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await supabase.from('users').insert({
        username: 'maru',
        password_hash: adminHash,
        name: 'Maru López',
        role: 'ADMIN',
        rate_per_hour: 0
      });
      console.log('✅ Usuario Administrador Maru López sembrado en Supabase');
    }

    // Check default proyectistas
    const defaultProyectistas = [
      { username: 'proyectista1', name: 'Proyectista 1', pass: '123456', rate: 50000 },
      { username: 'proyectista2', name: 'Proyectista 2', pass: '123456', rate: 60000 },
      { username: 'proyectista3', name: 'Proyectista 3', pass: '123456', rate: 55000 }
    ];

    for (const p of defaultProyectistas) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', p.username)
        .single();

      if (!existing) {
        const hash = await bcrypt.hash(p.pass, 10);
        await supabase.from('users').insert({
          username: p.username,
          password_hash: hash,
          name: p.name,
          role: 'PROYECTISTA',
          rate_per_hour: p.rate
        });
        console.log(`✅ Proyectista predeterminado sembrado: ${p.name}`);
      }
    }

    // Check default projects
    const defaultProjects = [
      { name: 'Obra Residencia Carmelitas', description: 'Construcción residencial de 2 plantas y quincho' },
      { name: 'Edificio Villa Morra', description: 'Proyecto corporativo y planos de detalle' },
      { name: 'Remodelación Casa Central', description: 'Remodelación interior y fiscalización' }
    ];

    for (const proj of defaultProjects) {
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('name', proj.name)
        .single();

      if (!existing) {
        await supabase.from('projects').insert({
          name: proj.name,
          description: proj.description,
          status: 'ACTIVE'
        });
        console.log(`✅ Obra inicial sembrada: ${proj.name}`);
      }
    }
  } catch (err) {
    console.error('⚠️ Nota al verificar datos iniciales en Supabase:', err.message);
  }
}

module.exports = {
  supabase,
  initDatabase
};
