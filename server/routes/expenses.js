const express = require('express');
const { supabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/expenses - List expenses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, user_id, category, status } = req.query;

    let query = supabase
      .from('expenses')
      .select(`
        id,
        expense_date,
        amount,
        category,
        description,
        status,
        created_at,
        project_id,
        user_id,
        projects ( id, name ),
        users ( id, name )
      `)
      .order('expense_date', { ascending: false })
      .order('id', { ascending: false });

    if (req.user.role !== 'ADMIN') {
      query = query.eq('user_id', req.user.id);
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (start_date) {
      query = query.gte('expense_date', start_date);
    }

    if (end_date) {
      query = query.lte('expense_date', end_date);
    }

    const { data: rows, error } = await query;
    if (error) {
      // Gracefully handle if table doesn't exist yet in schema cache
      if (error.code === 'PGRST301' || error.message.includes('expenses')) {
        return res.json([]);
      }
      throw error;
    }

    const sanitizedRows = (rows || []).map((row) => ({
      id: row.id,
      expense_date: row.expense_date,
      amount: parseFloat(row.amount || 0),
      category: row.category || 'OFFICE',
      description: row.description,
      status: row.status || 'PENDING',
      created_at: row.created_at,
      project_id: row.project_id,
      project_name: row.category === 'PROJECT' ? (row.projects?.name || 'Obra') : 'Oficina General',
      user_id: row.user_id,
      user_name: row.users?.name || 'Proyectista'
    }));

    res.json(sanitizedRows);
  } catch (err) {
    console.error('Error en GET /expenses:', err);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
});

// POST /api/expenses - Create new expense
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { expense_date, amount, category, project_id, description } = req.body;

    if (!expense_date || !amount || !description) {
      return res.status(400).json({ error: 'La fecha, monto y concepto son obligatorios' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'El monto ingresado debe ser mayor a 0' });
    }

    const payload = {
      user_id: req.user.id,
      expense_date,
      amount: parsedAmount,
      category: category === 'PROJECT' ? 'PROJECT' : 'OFFICE',
      project_id: category === 'PROJECT' ? (project_id || null) : null,
      description: description.trim(),
      status: 'PENDING'
    };

    const { data: inserted, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Gasto registrado exitosamente', expense: inserted });
  } catch (err) {
    console.error('Error en POST /expenses:', err);
    res.status(500).json({ error: 'Error al registrar el gasto. Asegúrate de haber ejecutado la tabla "expenses" en Supabase.' });
  }
});

// PUT /api/expenses/:id - Edit expense or change status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { expense_date, amount, category, project_id, description, status } = req.body;

    const { data: existing } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    if (req.user.role !== 'ADMIN' && existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este gasto' });
    }

    const updatePayload = {
      expense_date: expense_date || existing.expense_date,
      amount: amount ? parseFloat(amount) : existing.amount,
      category: category ? (category === 'PROJECT' ? 'PROJECT' : 'OFFICE') : existing.category,
      project_id: category ? (category === 'PROJECT' ? (project_id || null) : null) : existing.project_id,
      description: description !== undefined ? description.trim() : existing.description
    };

    if (req.user.role === 'ADMIN' && status) {
      updatePayload.status = status;
    }

    const { error } = await supabase.from('expenses').update(updatePayload).eq('id', id);
    if (error) throw error;

    res.json({ message: 'Gasto actualizado correctamente' });
  } catch (err) {
    console.error('Error en PUT /expenses:', err);
    res.status(500).json({ error: 'Error al actualizar el gasto' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    if (req.user.role !== 'ADMIN' && existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este gasto' });
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Gasto eliminado correctamente' });
  } catch (err) {
    console.error('Error en DELETE /expenses:', err);
    res.status(500).json({ error: 'Error al eliminar el gasto' });
  }
});

module.exports = router;
