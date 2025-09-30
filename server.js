// server.js - Backend intermediario para Supabase

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// --- Conexión a Supabase con la CLAVE SECRETA (Service Role Key) ---
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // ¡Esta es la clave secreta!
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Rutas de la API ---

// GET: Obtener todas las tareas
app.get('/api/tasks', async (req, res) => {
    const { data, error } = await supabase.from('tasks').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

// POST: Crear una nueva tarea
app.post('/api/tasks', async (req, res) => {
    const { name } = req.body;
    const { data, error } = await supabase.from('tasks').insert({ name }).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

// ... (Puedes añadir PUT y DELETE de la misma forma) ...

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor intermediario corriendo en http://localhost:${PORT}`);
});