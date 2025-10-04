import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[LOG] Petición recibida en schedule.js: ${req.method}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            console.log("[LOG] Obteniendo todas las tareas agendadas...");
            const { data, error } = await supabase.from('scheduled_tasks').select(`*, order_task:order_tasks(order_id, task:tasks(name))`);
            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'POST') {
            const { order_task_id, start_time, end_time, machine_id, operator_id, provider_id } = req.body;
            console.log("[LOG] Agendando tarea:", req.body);

            const { data: scheduledData, error: scheduleError } = await supabase.from('scheduled_tasks').insert({ order_task_id, start_time, end_time, machine_id, operator_id, provider_id }).select().single();
            if (scheduleError) throw scheduleError;
            console.log("[LOG] Tarea agendada con ID:", scheduledData.id);
            
            const { error: updateError } = await supabase.from('order_tasks').update({ status: 'scheduled' }).eq('id', order_task_id);
            if (updateError) throw updateError;
            console.log("[LOG] Estado de 'order_task' actualizado a 'scheduled'");

            return res.status(201).json(scheduledData);
        }
    } catch (error) {
        console.error('[ERROR] Error en la función schedule.js:', error);
        return res.status(500).json({ message: "Ocurrió un error en el servidor.", errorDetails: error.message });
    }
}