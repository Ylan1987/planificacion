// DENTRO DE: frontend/api/tasks.js

const { createClient } = require('@supabase/supabase-js');

// La conexión a Supabase se mantiene igual
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// La función principal que Vercel ejecutará, ahora con logs
export default async function handler(req, res) {
    // --> LOG 1: Registra cada petición que llega
    console.log(`[LOG] Petición recibida: ${req.method} en ${req.url}`);

    // ... (El código de CORS no cambia)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Usamos un bloque try...catch para atrapar cualquier error inesperado
    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase.from('tasks').select('*').order('name');
            
            // --> LOG 2: Muestra la respuesta de Supabase para GET
            console.log('[LOG] Respuesta de Supabase (GET):', { data, error });

            if (error) throw error; // Lanza el error para que lo atrape el catch

            return res.status(200).json(data);
        } 
        if (req.method === 'PUT') {
            const { id, name } = req.body;
            const { data, error } = await supabase
                .from('tasks')
                .update({ name })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return res.status(200).json(data[0]);
        }
        if (req.method === 'DELETE') {
            const { id } = req.body;
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.status(204).end(); // 204 significa "éxito, sin contenido"
        }
        if (req.method === 'POST') {
            // --> LOG 3: Muestra exactamente lo que llega en el body de la petición
            console.log('[LOG] Body recibido en POST:', req.body);
            
            const { name } = req.body;

            if (!name) {
                console.error('[ERROR] Intento de crear una tarea sin nombre.');
                return res.status(400).json({ error: "El nombre de la tarea es requerido." });
            }

            const { data, error } = await supabase.from('tasks').insert({ name }).select();
            
            // --> LOG 4: Muestra la respuesta de Supabase para POST
            console.log('[LOG] Respuesta de Supabase (POST):', { data, error });

            if (error) throw error; // Lanza el error para que lo atrape el catch

            return res.status(201).json(data[0]);
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']); // Añadimos los nuevos métodos
        res.status(405).end(`Método ${req.method} no permitido`);


    } catch (error) {
        // --> LOG 5: Atrapa y muestra cualquier error que ocurra en el proceso
        console.error('[ERROR] Error general en la función:', error);
        return res.status(500).json({ error: error.message || "Ocurrió un error inesperado en el servidor." });
    }
}