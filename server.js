// server.js - Nuestro Backend con Node.js y Express

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3001; // Puerto para nuestro servidor

// --- Middlewares ---
app.use(cors()); // Permite que el frontend y el backend se comuniquen
app.use(express.json()); // Permite al servidor entender datos en formato JSON

// --- Conexión a la Base de Datos SQLite ---
// Esto creará un archivo llamado 'produccion.db' si no existe
const db = new sqlite3.Database('./produccion.db', (err) => {
    if (err) {
        console.error("Error abriendo la base de datos:", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite.");
        // Creamos la tabla de Tareas si no existe
        db.run(`CREATE TABLE IF NOT EXISTS Tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_tarea TEXT NOT NULL UNIQUE
        )`);
    }
});

// --- Rutas de la API para TAREAS ---

// GET: Obtener todas las tareas
app.get('/api/tareas', (req, res) => {
    const sql = "SELECT * FROM Tareas ORDER BY nombre_tarea";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// POST: Crear una nueva tarea
app.post('/api/tareas', (req, res) => {
    const { nombre_tarea } = req.body;
    if (!nombre_tarea) {
        res.status(400).json({ "error": "El nombre de la tarea es requerido." });
        return;
    }
    const sql = 'INSERT INTO Tareas (nombre_tarea) VALUES (?)';
    db.run(sql, [nombre_tarea], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({
            "message": "success",
            "data": { id: this.lastID, nombre_tarea: nombre_tarea }
        });
    });
});

// PUT: Actualizar una tarea existente
app.put('/api/tareas/:id', (req, res) => {
    const { nombre_tarea } = req.body;
    const { id } = req.params;
    const sql = 'UPDATE Tareas SET nombre_tarea = ? WHERE id = ?';
    db.run(sql, [nombre_tarea, id], function(err) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        res.json({
            message: "success",
            changes: this.changes
        });
    });
});

// DELETE: Eliminar una tarea
app.delete('/api/tareas/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Tareas WHERE id = ?';
    db.run(sql, id, function(err) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});