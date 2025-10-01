import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    console.log(`[LOG] Petición recibida en products.js: ${req.method}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase.from('products').select(`id, name, product_workflows (id, task_id, is_optional, prerequisites, tasks (id, name))`);
            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            const isCreating = req.method === 'POST';
            const { id, name, workflow } = req.body;

            // 1. Crear o actualizar el producto
            let productData, productError;
            if (isCreating) {
                ({ data: productData, error: productError } = await supabase.from('products').insert({ name }).select().single());
            } else {
                ({ data: productData, error: productError } = await supabase.from('products').update({ name }).eq('id', id).select().single());
            }
            if (productError) throw productError;
            const productId = isCreating ? productData.id : id;

            // 2. Sincronizar el flujo de trabajo (workflow)
            const { error: deleteError } = await supabase.from('product_workflows').delete().eq('product_id', productId);
            if (deleteError) throw deleteError;

            if (workflow && workflow.length > 0) {
                const workflowToInsert = workflow.map(wf => ({
                    product_id: productId,
                    task_id: wf.task_id,
                    is_optional: wf.is_optional,
                    prerequisites: wf.prerequisites
                }));
                const { error: insertError } = await supabase.from('product_workflows').insert(workflowToInsert);
                if (insertError) throw insertError;
            }
            return res.status(isCreating ? 201 : 200).json(productData);
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            return res.status(204).end();
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Método ${req.method} no permitido`);
    } catch (error) {
        console.error('[ERROR] Error en la función products.js:', error);
        return res.status(500).json({ message: "Ocurrió un error en el servidor.", errorDetails: error.message });
    }
}