const express = require('express');
const { supabase } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects - List active projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(projects || []);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});

// POST /api/projects - Create new project (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
    }

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Ya existe un proyecto con ese nombre' });
    }

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        description: description ? description.trim() : '',
        status: 'ACTIVE'
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Proyecto creado exitosamente', project: newProject });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});

// PUT /api/projects/:id - Update project (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (description !== undefined) updatePayload.description = description.trim();
    if (status !== undefined) updatePayload.status = status;

    const { data: updated, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    res.json({ message: 'Proyecto actualizado correctamente', project: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
});

// DELETE /api/projects/:id - Delete project (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
});

module.exports = router;
