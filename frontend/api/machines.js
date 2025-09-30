// frontend/api/machines.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    console.log(`[LOG] Petición recibida: ${req.method} en ${req.url}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('machines')
                .select(`id, name, machine_tasks (id, task_id, setup_time, finish_time, work_time_rules, tasks (id, name))`);
            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'POST') {
            const { name, tasks } = req.body;

            // 1. Crear la máquina
            const { data: machineData, error: machineError } = await supabase
                .from('machines')
                .insert({ name })
                .select()
                .single();

            if (machineError) throw machineError;

            // 2. Si hay tareas, vincularlas a la máquina
            if (tasks && tasks.length > 0) {
                const tasksToInsert = tasks.map(t => ({
                    machine_id: machineData.id,
                    task_id: t.task_id,
                    setup_time: t.setup_time,
                    finish_time: t.finish_time,
                    work_time_rules: t.work_time_rules
                }));

                const { error: tasksError } = await supabase.from('machine_tasks').insert(tasksToInsert);
                if (tasksError) throw tasksError;
            }

            return res.status(201).json(machineData);
        }
        if (req.method === 'PUT') {
            const { id, name, tasks } = req.body;

            // 1. Actualizar el nombre de la máquina
            const { error: machineError } = await supabase.from('machines').update({ name }).eq('id', id);
            if (machineError) throw machineError;

            // 2. Eliminar todas las tareas vinculadas anteriormente para reemplazarlas
            const { error: deleteError } = await supabase.from('machine_tasks').delete().eq('machine_id', id);
            if (deleteError) throw deleteError;

            // 3. Insertar las nuevas tareas vinculadas
            if (tasks && tasks.length > 0) {
                const tasksToInsert = tasks.map(t => ({
                    machine_id: id,
                    task_id: t.task_id,
                    setup_time: t.setup_time,
                    finish_time: t.finish_time,
                    work_time_rules: t.work_time_rules
                }));
                const { error: insertError } = await supabase.from('machine_tasks').insert(tasksToInsert);
                if (insertError) throw insertError;
            }
            return res.status(200).json({ message: 'Máquina actualizada' });
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            // Gracias a "ON DELETE CASCADE" en la base de datos,
            // al eliminar una máquina, se eliminan automáticamente sus machine_tasks.
            const { error } = await supabase.from('machines').delete().eq('id', id);
            if (error) throw error;
            return res.status(204).end();
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Método ${req.method} no permitido`);


    } catch (error) {
        console.error('[ERROR] Error en la función de máquinas:', error);
        return res.status(500).json({ error: error.message || "Ocurrió un error inesperado." });
    }
}