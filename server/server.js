const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const proyectistaRoutes = require('./routes/proyectistas');
const projectRoutes = require('./routes/projects');
const timesheetRoutes = require('./routes/timesheets');
const expenseRoutes = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/proyectistas', proyectistaRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/expenses', expenseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Lopez Arq - Control de Horas', time: new Date() });
});

// Serve frontend static build if available
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint API no encontrado' });
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API de Lopez Arq está en ejecución. El frontend se compilará próximamente.');
    }
  });
});

// Initialize Database & Start Server
initDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor Lopez Arq escuchando en http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al inicializar la base de datos:', err);
  });
