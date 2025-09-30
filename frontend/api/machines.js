// frontend/api/machines.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    console.log(`[LOG] Petición recibida en machines.js: ${req.method} en ${req.url}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            console.log("[LOG] Manejando GET para obtener máquinas...");
            const { data, error } = await supabase.from('machines').select(`id, name, machine_tasks (id, task_id, setup_time, finish_time, work_time_rules, tasks (id, name))`);
            console.log('[LOG] Respuesta de Supabase (GET machines):', { error });
            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'POST') {
            console.log("[LOG] Manejando POST para crear máquina...");
            console.log("[LOG] Body recibido:", req.body);
            const { name, tasks } = req.body;

            const { data: machineData, error: machineError } = await supabase.from('machines').insert({ name }).select().single();
            console.log('[LOG] Respuesta de Supabase (Insert machine):', { machineError });
            if (machineError) throw machineError;

            if (tasks && tasks.length > 0) {
                const tasksToInsert = tasks.map(t => ({ machine_id: machineData.id, ...t }));
                console.log('[LOG] Insertando tareas vinculadas:', tasksToInsert);
                const { error: tasksError } = await supabase.from('machine_tasks').insert(tasksToInsert);
                console.log('[LOG] Respuesta de Supabase (Insert machine_tasks):', { tasksError });
                if (tasksError) throw tasksError;
            }
            return res.status(201).json(machineData);
        }
        
        if (req.method === 'PUT') {
            console.log("[LOG] Manejando PUT para actualizar máquina...");
            console.log("[LOG] Body recibido:", req.body);
            const { id, name, tasks } = req.body;

            const { error: machineError } = await supabase.from('machines').update({ name }).eq('id', id);
            console.log('[LOG] Respuesta de Supabase (Update machine):', { machineError });
            if (machineError) throw machineError;

            const { error: deleteError } = await supabase.from('machine_tasks').delete().eq('machine_id', id);
            console.log('[LOG] Respuesta de Supabase (Delete old machine_tasks):', { deleteError });
            if (deleteError) throw deleteError;

            if (tasks && tasks.length > 0) {
                const tasksToInsert = tasks.map(t => ({ machine_id: id, ...t }));
                console.log('[LOG] Insertando nuevas tareas vinculadas:', tasksToInsert);
                const { error: insertError } = await supabase.from('machine_tasks').insert(tasksToInsert);
                console.log('[LOG] Respuesta de Supabase (Insert new machine_tasks):', { insertError });
                if (insertError) throw insertError;
            }
            return res.status(200).json({ message: 'Máquina actualizada' });
        }

        if (req.method === 'DELETE') {
            console.log("[LOG] Manejando DELETE para eliminar máquina...");
            console.log("[LOG] Body recibido:", req.body);
            const { id } = req.body;

            const { error } = await supabase.from('machines').delete().eq('id', id);
            console.log('[LOG] Respuesta de Supabase (Delete machine):', { error });
            if (error) throw error;
            return res.status(204).end();
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Método ${req.method} no permitido`);

    } catch (error) {
        console.error('[ERROR] Error general en la función machines.js:', error);
        return res.status(500).json({ 
            message: "Ocurrió un error en el servidor.",
            errorDetails: error.message 
        });
    }
}