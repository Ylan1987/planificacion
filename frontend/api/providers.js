import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    console.log(`[LOG] Petición recibida en providers.js: ${req.method} en ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            console.log("[LOG] Manejando GET para obtener proveedores...");
            const { data, error } = await supabase.from('providers').select(`id, name, provider_tasks (id, task_id, delivery_time_days, tasks (id, name))`);
            console.log('[LOG] Respuesta de Supabase (GET providers):', { error });
            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            const isCreating = req.method === 'POST';
            console.log(`[LOG] Manejando ${isCreating ? 'POST' : 'PUT'} para ${isCreating ? 'crear' : 'actualizar'} proveedor...`);
            console.log("[LOG] Body recibido:", req.body);
            const { id, name, tasks } = req.body;

            // 1. Crear o actualizar el proveedor
            let providerData, providerError;
            if (isCreating) {
                ({ data: providerData, error: providerError } = await supabase.from('providers').insert({ name }).select().single());
            } else {
                ({ data: providerData, error: providerError } = await supabase.from('providers').update({ name }).eq('id', id).select().single());
            }
            console.log(`[LOG] Respuesta de Supabase (${isCreating ? 'Insert' : 'Update'} provider):`, { providerError });
            if (providerError) throw providerError;

            const providerId = isCreating ? providerData.id : id;

            // 2. Sincronizar las tareas (borrar las viejas e insertar las nuevas)
            const { error: deleteError } = await supabase.from('provider_tasks').delete().eq('provider_id', providerId);
            console.log('[LOG] Respuesta de Supabase (Delete old provider_tasks):', { deleteError });
            if (deleteError) throw deleteError;

            if (tasks && tasks.length > 0) {
                const tasksToInsert = tasks.filter(t => t.task_id).map(t => ({ provider_id: providerId, task_id: t.task_id, delivery_time_days: t.delivery_time_days }));
                console.log('[LOG] Insertando nuevas tareas vinculadas:', tasksToInsert);
                const { error: insertError } = await supabase.from('provider_tasks').insert(tasksToInsert);
                console.log('[LOG] Respuesta de Supabase (Insert new provider_tasks):', { insertError });
                if (insertError) throw insertError;
            }
            return res.status(isCreating ? 201 : 200).json(providerData);
        }

        if (req.method === 'DELETE') {
            console.log("[LOG] Manejando DELETE para eliminar proveedor...");
            console.log("[LOG] Body recibido:", req.body);
            const { id } = req.body;
            const { error } = await supabase.from('providers').delete().eq('id', id);
            console.log('[LOG] Respuesta de Supabase (Delete provider):', { error });
            if (error) throw error;
            return res.status(204).end();
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Método ${req.method} no permitido`);
    } catch (error) {
        console.error('[ERROR] Error en la función providers.js:', error);
        return res.status(500).json({ message: "Ocurrió un error en el servidor.", errorDetails: error.message });
    }
}