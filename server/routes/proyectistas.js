const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/proyectistas - List all proyectistas
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, name, role, rate_per_hour, created_at')
        .eq('role', 'PROYECTISTA')
        .order('name', { ascending: true });

      if (error) throw error;
      res.json(users || []);
    } else {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'PROYECTISTA')
        .order('name', { ascending: true });

      if (error) throw error;
      res.json(users || []);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener proyectistas' });
  }
});

// POST /api/proyectistas - Create a new proyectista (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, name, password, rate_per_hour } = req.body;
    if (!username || !name || !password) {
      return res.status(400).json({ error: 'Usuario, Nombre y Contraseña son obligatorios' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', cleanUsername)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const rate = parseFloat(rate_per_hour) || 0;

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username: cleanUsername,
        password_hash,
        name: name.trim(),
        role: 'PROYECTISTA',
        rate_per_hour: rate
      })
      .select('id, username, name, role, rate_per_hour')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Proyectista creado exitosamente', proyectista: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear proyectista' });
  }
});

// PUT /api/proyectistas/:id - Update proyectista details (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, rate_per_hour, password } = req.body;

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'PROYECTISTA')
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Proyectista no encontrado' });
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (rate_per_hour !== undefined) updatePayload.rate_per_hour = parseFloat(rate_per_hour);

    if (username !== undefined) {
      const cleanUser = username.trim().toLowerCase();
      if (cleanUser !== existing.username) {
        const { data: taken } = await supabase
          .from('users')
          .select('id')
          .eq('username', cleanUser)
          .single();
        if (taken) {
          return res.status(400).json({ error: 'El nombre de usuario ya pertenece a otra cuenta' });
        }
        updatePayload.username = cleanUser;
      }
    }

    if (password && password.trim() !== '') {
      updatePayload.password_hash = await bcrypt.hash(password, 10);
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select('id, username, name, role, rate_per_hour')
      .single();

    if (error) throw error;

    res.json({ message: 'Proyectista actualizado correctamente', proyectista: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar proyectista' });
  }
});

// DELETE /api/proyectistas/:id - Delete proyectista (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Proyectista eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar proyectista' });
  }
});

module.exports = router;
