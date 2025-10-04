import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    console.log(`[LOG] Petición recibida en operators.js: ${req.method}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            console.log("[LOG] Manejando GET para obtener operarios...");
            const { data, error } = await supabase.from('operators').select(`id, name, type, schedule, operator_skills (machine_id)`);
            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            const isCreating = req.method === 'POST';
            console.log(`[LOG] Manejando ${isCreating ? 'POST' : 'PUT'} para ${isCreating ? 'crear' : 'actualizar'} operario...`);
            const { id, name, type, schedule, skills } = req.body;

            // 1. Crear o actualizar el operario
            let operatorData, operatorError;
            const operatorPayload = { name, type, schedule };
            if (isCreating) {
                ({ data: operatorData, error: operatorError } = await supabase.from('operators').insert(operatorPayload).select().single());
            } else {
                ({ data: operatorData, error: operatorError } = await supabase.from('operators').update(operatorPayload).eq('id', id).select().single());
            }
            if (operatorError) throw operatorError;

            const operatorId = isCreating ? operatorData.id : id;

            // 2. Sincronizar habilidades (skills)
            const { error: deleteError } = await supabase.from('operator_skills').delete().eq('operator_id', operatorId);
            if (deleteError) throw deleteError;

            if (skills && skills.length > 0) {
                const skillsToInsert = skills.map(machine_id => ({ operator_id: operatorId, machine_id }));
                const { error: insertError } = await supabase.from('operator_skills').insert(skillsToInsert);
                if (insertError) throw insertError;
            }
            return res.status(isCreating ? 201 : 200).json(operatorData);
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            console.log(`[LOG] Eliminando operario con id: ${id}`);
            const { error } = await supabase.from('operators').delete().eq('id', id);
            if (error) throw error;
            return res.status(204).end();
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Método ${req.method} no permitido`);
    } catch (error) {
        console.error('[ERROR] Error en la función operators.js:', error);
        return res.status(500).json({ message: "Ocurrió un error en el servidor.", errorDetails: error.message });
    }
}