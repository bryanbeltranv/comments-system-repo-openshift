const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8081;

// Configuración de PostgreSQL desde variables de entorno
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'comments_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Middleware
app.use(express.json());

// Verificar conexión a la base de datos
async function checkDatabaseConnection() {
  let retries = 5;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('✓ Database connection established');
      
      // Crear tabla si no existe
      await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          author VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Comments table verified');
      
      client.release();
      return true;
    } catch (error) {
      retries--;
      console.error(`✗ Database connection failed. Retries left: ${retries}`);
      console.error(`Error: ${error.message}`);
      if (retries > 0) {
        console.log('Waiting 5 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  console.error('✗ Could not connect to database after multiple retries');
  return false;
}

// Health check
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.json({ 
      status: 'healthy', 
      service: 'backend-data',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      service: 'backend-data',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET - Obtener todos los comentarios
app.get('/data/comments', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log(`[${new Date().toISOString()}] GET /data/comments - Fetching all comments`);
    
    const result = await client.query(
      'SELECT id, author, content, created_at FROM comments ORDER BY created_at DESC'
    );
    
    console.log(`[${new Date().toISOString()}] Found ${result.rows.length} comments`);
    res.json(result.rows);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching comments:`, error.message);
    res.status(500).json({ 
      error: 'Database error',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// POST - Crear un nuevo comentario
app.post('/data/comments', async (req, res) => {
  const client = await pool.connect();
  try {
    const { author, content } = req.body;
    
    // Validación
    if (!author || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Author and content are required' 
      });
    }
    
    console.log(`[${new Date().toISOString()}] POST /data/comments - Creating comment`);
    console.log(`Data: author="${author}", content="${content.substring(0, 50)}..."`);
    
    const result = await client.query(
      'INSERT INTO comments (author, content) VALUES ($1, $2) RETURNING id, author, content, created_at',
      [author, content]
    );
    
    const newComment = result.rows[0];
    console.log(`[${new Date().toISOString()}] Comment created with ID: ${newComment.id}`);
    
    res.status(201).json(newComment);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error creating comment:`, error.message);
    res.status(500).json({ 
      error: 'Database error',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// GET - Obtener un comentario específico por ID
app.get('/data/comments/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    console.log(`[${new Date().toISOString()}] GET /data/comments/${id}`);
    
    const result = await client.query(
      'SELECT id, author, content, created_at FROM comments WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Comment with id ${id} does not exist` 
      });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching comment:`, error.message);
    res.status(500).json({ 
      error: 'Database error',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// DELETE - Eliminar un comentario (opcional, para mantenimiento)
app.delete('/data/comments/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    console.log(`[${new Date().toISOString()}] DELETE /data/comments/${id}`);
    
    const result = await client.query(
      'DELETE FROM comments WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Comment with id ${id} does not exist` 
      });
    }
    
    res.json({ 
      message: 'Comment deleted successfully',
      id: result.rows[0].id 
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error deleting comment:`, error.message);
    res.status(500).json({ 
      error: 'Database error',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /health',
      'GET /data/comments',
      'POST /data/comments',
      'GET /data/comments/:id',
      'DELETE /data/comments/:id'
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
async function startServer() {
  const dbConnected = await checkDatabaseConnection();
  
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║       Backend Data - Sistema de Comentarios       ║
╠═══════════════════════════════════════════════════╣
║  Port:                 ${PORT}                        ║
║  Database Host:        ${process.env.DB_HOST || 'localhost'}
║  Database Name:        ${process.env.DB_NAME || 'comments_db'}
║  Status:               Running ✓                  ║
║  Timestamp:            ${new Date().toISOString()} ║
╚═══════════════════════════════════════════════════╝
    `);
  });
}

// Manejo de señales de terminación
process.on('SIGTERM', async () => {
  console.log('[SIGTERM] Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[SIGINT] Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Iniciar
startServer();