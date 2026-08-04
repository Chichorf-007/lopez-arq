const express = require('express');
const { supabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function calculateHoursBetween(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const diffMinutes = endMinutes - startMinutes;
  return Math.round((diffMinutes / 60) * 100) / 100;
}

// GET /api/timesheets - List timesheet records with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, project_id, user_id } = req.query;

    let query = supabase
      .from('timesheets')
      .select(`
        id,
        work_date,
        start_time,
        end_time,
        hours,
        description,
        created_at,
        project_id,
        user_id,
        projects ( id, name ),
        users ( id, name, rate_per_hour )
      `)
      .order('work_date', { ascending: false })
      .order('id', { ascending: false });

    if (req.user.role !== 'ADMIN') {
      query = query.eq('user_id', req.user.id);
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (start_date) {
      query = query.gte('work_date', start_date);
    }

    if (end_date) {
      query = query.lte('work_date', end_date);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const sanitizedRows = (rows || []).map((row) => {
      const rate = row.users?.rate_per_hour || 0;
      const total_cost = row.hours * rate;

      const item = {
        id: row.id,
        work_date: row.work_date,
        start_time: row.start_time || '08:00',
        end_time: row.end_time || '12:00',
        hours: parseFloat(row.hours),
        description: row.description,
        created_at: row.created_at,
        project_id: row.project_id,
        project_name: row.projects?.name || 'Obra',
        user_id: row.user_id,
        user_name: row.users?.name || 'Proyectista'
      };

      if (req.user.role === 'ADMIN') {
        item.rate_per_hour = parseFloat(rate);
        item.total_cost = parseFloat(total_cost);
      }

      return item;
    });

    res.json(sanitizedRows);
  } catch (err) {
    console.error('Error en GET /timesheets:', err);
    res.status(500).json({ error: 'Error al obtener registros de horas' });
  }
});

// GET /api/timesheets/summary - Metrics & totals
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('timesheets')
      .select(`
        hours,
        project_id,
        user_id,
        projects ( id, name ),
        users ( id, name, rate_per_hour )
      `);

    if (req.user.role !== 'ADMIN') {
      query = query.eq('user_id', req.user.id);
    }

    if (start_date) {
      query = query.gte('work_date', start_date);
    }

    if (end_date) {
      query = query.lte('work_date', end_date);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    let totalHours = 0;
    let totalCost = 0;
    const projectMap = {};
    const userMap = {};

    (rows || []).forEach((row) => {
      const h = parseFloat(row.hours) || 0;
      const rate = parseFloat(row.users?.rate_per_hour) || 0;
      const cost = h * rate;

      totalHours += h;
      totalCost += cost;

      // Project breakdown
      const pId = row.project_id;
      const pName = row.projects?.name || 'Obra';
      if (!projectMap[pId]) {
        projectMap[pId] = { project_id: pId, project_name: pName, hours: 0, cost: 0 };
      }
      projectMap[pId].hours += h;
      projectMap[pId].cost += cost;

      // User breakdown
      const uId = row.user_id;
      const uName = row.users?.name || 'Proyectista';
      if (!userMap[uId]) {
        userMap[uId] = { user_id: uId, user_name: uName, rate_per_hour: rate, hours: 0, cost: 0 };
      }
      userMap[uId].hours += h;
      userMap[uId].cost += cost;
    });

    const projectBreakdown = Object.values(projectMap).map((p) => {
      const item = { project_id: p.project_id, project_name: p.project_name, hours: p.hours };
      if (req.user.role === 'ADMIN') item.cost = p.cost;
      return item;
    });

    const userBreakdown = Object.values(userMap).map((u) => {
      const item = { user_id: u.user_id, user_name: u.user_name, hours: u.hours };
      if (req.user.role === 'ADMIN') {
        item.rate_per_hour = u.rate_per_hour;
        item.cost = u.cost;
      }
      return item;
    });

    const response = {
      total_hours: totalHours,
      by_project: projectBreakdown,
      by_user: userBreakdown
    };

    if (req.user.role === 'ADMIN') {
      response.total_cost = totalCost;
    }

    res.json(response);
  } catch (err) {
    console.error('Error en GET /timesheets/summary:', err);
    res.status(500).json({ error: 'Error al generar resumen de horas' });
  }
});

// POST /api/timesheets - Create new timesheet entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { project_id, work_date, start_time, end_time, description, user_id } = req.body;

    if (!project_id || !work_date || !start_time || !end_time || !description) {
      return res.status(400).json({ 
        error: 'Todos los campos son obligatorios: Obra, Fecha, Hora Inicio, Hora Fin y Descripción' 
      });
    }

    const calculatedHours = calculateHoursBetween(start_time, end_time);
    if (calculatedHours <= 0) {
      return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
    }

    let targetUserId = req.user.id;
    if (req.user.role === 'ADMIN' && user_id) {
      targetUserId = user_id;
    }

    const { data: inserted, error } = await supabase
      .from('timesheets')
      .insert({
        user_id: targetUserId,
        project_id,
        work_date,
        start_time,
        end_time,
        hours: calculatedHours,
        description: description.trim()
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Horas registradas exitosamente', timesheet: inserted });
  } catch (err) {
    console.error('Error en POST /timesheets:', err);
    res.status(500).json({ error: 'Error al registrar horas' });
  }
});

// PUT /api/timesheets/:id - Edit timesheet entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, work_date, start_time, end_time, description } = req.body;

    const { data: existing } = await supabase
      .from('timesheets')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Registro de horas no encontrado' });
    }

    if (req.user.role !== 'ADMIN' && existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este registro' });
    }

    const updatedStart = start_time || existing.start_time || '08:00';
    const updatedEnd = end_time || existing.end_time || '12:00';
    const updatedHours = calculateHoursBetween(updatedStart, updatedEnd);

    const updatePayload = {
      project_id: project_id || existing.project_id,
      work_date: work_date || existing.work_date,
      start_time: updatedStart,
      end_time: updatedEnd,
      hours: updatedHours,
      description: description !== undefined ? description.trim() : existing.description
    };

    const { error } = await supabase.from('timesheets').update(updatePayload).eq('id', id);
    if (error) throw error;

    res.json({ message: 'Registro actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar registro' });
  }
});

// DELETE /api/timesheets/:id - Delete timesheet entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('timesheets').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Registro eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar registro' });
  }
});

module.exports = router;
