const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fxdcgicxyasrboovmbwm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_f_BqO47yu0_5focPXBl7SA_ojpat60d';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('🌱 Sembrando usuarios reales y proyectos en Supabase...');

  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    
    // Seed admin accounts (both maru.lopez and maru for convenience)
    await supabase.from('users').upsert([
      { username: 'maru.lopez', password_hash: adminHash, name: 'Maru López', role: 'ADMIN', rate_per_hour: 0 },
      { username: 'maru', password_hash: adminHash, name: 'Maru López', role: 'ADMIN', rate_per_hour: 0 }
    ], { onConflict: 'username' });

    console.log('✅ Usuario Administrador maru.lopez / admin123 creado');

    // Real proyectistas with nombre.apellido and randomized initial passwords
    const defaultProyectistas = [
      { username: 'lucas.perez', name: 'Arq. Lucas Pérez', pass: 'lp8421', rate: 50000 },
      { username: 'sofia.benitez', name: 'Arq. Sofía Benítez', pass: 'sb3952', rate: 60000 },
      { username: 'rodrigo.silva', name: 'Arq. Rodrigo Silva', pass: 'rs7164', rate: 55000 }
    ];

    for (const p of defaultProyectistas) {
      const hash = await bcrypt.hash(p.pass, 10);
      const { error } = await supabase.from('users').upsert({
        username: p.username,
        password_hash: hash,
        name: p.name,
        role: 'PROYECTISTA',
        rate_per_hour: p.rate
      }, { onConflict: 'username' });

      if (error) console.error(`Error al crear ${p.username}:`, error);
      else console.log(`✅ Proyectista ${p.name} (${p.username} / ${p.pass}) creado`);
    }

    // Default projects with clear descriptions
    const defaultProjects = [
      { name: 'Obra Residencia Carmelitas', description: 'Construcción residencial de 2 plantas y quincho en zona Carmelitas' },
      { name: 'Edificio Villa Morra', description: 'Proyecto corporativo de 5 pisos y planos de detalle de estructura' },
      { name: 'Remodelación Casa Central', description: 'Remodelación de fachadas interiores y fiscalización de obra' }
    ];

    for (const proj of defaultProjects) {
      await supabase.from('projects').upsert({
        name: proj.name,
        description: proj.description,
        status: 'ACTIVE'
      }, { onConflict: 'name' });
      console.log(`✅ Obra "${proj.name}" creada con descripción`);
    }

    console.log('\n🎉 ¡PROCESO FINALIZADO CON ÉXITO EN SUPABASE!');
  } catch (err) {
    console.error('❌ Error durante la siembra:', err);
  }
}

seed();
