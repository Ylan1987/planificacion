// api/tasks.js - Nuestra Función Serverless para Vercel

const { createClient } = require('@supabase/supabase-js');

// La conexión a Supabase se hace con las variables de entorno de Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// La función principal que Vercel ejecutará
export default async function handler(req, res) {
    // Permitir CORS para que el frontend pueda llamar a esta función
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Distinguir entre peticiones GET y POST
    if (req.method === 'GET') {
        const { data, error } = await supabase.from('tasks').select('*').order('name');
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    } 
    
    
    if (req.method === 'POST') {
        // Solución: Parsear el body para convertirlo en un objeto JSON.
        const body = JSON.parse(req.body);
        const name = body.name;

        // Ahora sí, 'name' tiene el valor correcto.
        const { data, error } = await supabase.from('tasks').insert({ name }).select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data[0]);
    }

    // Si es otro método, devolver un error
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}