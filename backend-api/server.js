const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// URL del backend-data (se configura via variable de entorno)
const BACKEND_DATA_URL = process.env.BACKEND_DATA_URL || 'http://backend-data:8081';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'backend-api',
    timestamp: new Date().toISOString()
  });
});

// GET - Obtener todos los comentarios
app.get('/api/comments', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] GET /api/comments - Forwarding to ${BACKEND_DATA_URL}/data/comments`);
    
    const response = await axios.get(`${BACKEND_DATA_URL}/data/comments`, {
      timeout: 5000
    });
    
    console.log(`[${new Date().toISOString()}] Response received from backend-data: ${response.data.length} comments`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching comments:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Backend data service unavailable',
        message: 'Cannot connect to backend-data service'
      });
    }
    
    res.status(500).json({ 
      error: 'Error fetching comments',
      message: error.message 
    });
  }
});

// POST - Crear un nuevo comentario
app.post('/api/comments', async (req, res) => {
  try {
    const { author, content } = req.body;
    
    // Validación básica
    if (!author || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Author and content are required' 
      });
    }
    
    if (author.trim().length === 0 || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Invalid input',
        message: 'Author and content cannot be empty' 
      });
    }
    
    console.log(`[${new Date().toISOString()}] POST /api/comments - Forwarding to ${BACKEND_DATA_URL}/data/comments`);
    console.log(`Data: author="${author}", content="${content.substring(0, 50)}..."`);
    
    const response = await axios.post(
      `${BACKEND_DATA_URL}/data/comments`,
      { author, content },
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log(`[${new Date().toISOString()}] Comment created successfully`);
    res.status(201).json(response.data);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error creating comment:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Backend data service unavailable',
        message: 'Cannot connect to backend-data service'
      });
    }
    
    res.status(500).json({ 
      error: 'Error creating comment',
      message: error.message 
    });
  }
});

// GET - Obtener un comentario específico por ID
app.get('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[${new Date().toISOString()}] GET /api/comments/${id} - Forwarding to backend-data`);
    
    const response = await axios.get(`${BACKEND_DATA_URL}/data/comments/${id}`, {
      timeout: 5000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching comment:`, error.message);
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ 
        error: 'Comment not found',
        message: `Comment with id ${req.params.id} does not exist`
      });
    }
    
    res.status(500).json({ 
      error: 'Error fetching comment',
      message: error.message 
    });
  }
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /health',
      'GET /api/comments',
      'POST /api/comments',
      'GET /api/comments/:id'
    ]
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║         Backend API - Sistema de Comentarios      ║
╠═══════════════════════════════════════════════════╣
║  Port:                 ${PORT}                        ║
║  Backend Data URL:     ${BACKEND_DATA_URL}
║  Status:               Running ✓                  ║
║  Timestamp:            ${new Date().toISOString()} ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('[SIGTERM] Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SIGINT] Shutting down gracefully...');
  process.exit(0);
});