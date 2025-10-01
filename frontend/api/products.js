import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

        if (req.method === 'POST') {
            const { name, workflow } = JSON.parse(req.body);
            
            const { data: productData, error: productError } = await supabase.from('products').insert({ name }).select().single();
            if (productError) throw productError;
            const productId = productData.id;

            if (workflow && workflow.length > 0) {
                const tempIdToRealId = new Map();
                const initialWorkflowToInsert = workflow.map(wf => ({ product_id: productId, task_id: wf.task_id, is_optional: wf.is_optional, prerequisites: [] }));
                const { data: insertedWorkflows, error: insertError } = await supabase.from('product_workflows').insert(initialWorkflowToInsert).select();
                if (insertError) throw insertError;

                insertedWorkflows.forEach((realWf, index) => {
                    tempIdToRealId.set(workflow[index].temp_id, realWf.id);
                });

                const updatePromises = [];
                workflow.forEach((originalWf, index) => {
                    const realWfId = insertedWorkflows[index].id;
                    if (originalWf.prerequisites && originalWf.prerequisites.length > 0) {
                        const realPrerequisites = originalWf.prerequisites.map(tempId => tempIdToRealId.get(tempId)).filter(Boolean);
                        if (realPrerequisites.length > 0) {
                            updatePromises.push(supabase.from('product_workflows').update({ prerequisites: realPrerequisites }).eq('id', realWfId));
                        }
                    }
                });
                await Promise.all(updatePromises);
            }
            return res.status(201).json(productData);
        }

        if (req.method === 'PUT') {
            const { id, name, workflow } = JSON.parse(req.body);

            const { error: productError } = await supabase.from('products').update({ name }).eq('id', id);
            if (productError) throw productError;

            const newWorkflowSteps = workflow.filter(wf => !wf.id);
            const existingWorkflowSteps = workflow.filter(wf => wf.id);
            
            const existingIds = existingWorkflowSteps.map(wf => wf.id);
            if (existingIds.length > 0) {
                const { error: deleteError } = await supabase.from('product_workflows').delete().eq('product_id', id).not('id', 'in', `(${existingIds.join(',')})`);
                if (deleteError) throw deleteError;
            } else {
                 const { error: deleteAllError } = await supabase.from('product_workflows').delete().eq('product_id', id);
                 if (deleteAllError) throw deleteAllError;
            }

            if (newWorkflowSteps.length > 0) {
                const initialStepsToInsert = newWorkflowSteps.map(wf => ({ product_id: id, task_id: wf.task_id, is_optional: wf.is_optional, prerequisites: [] }));
                const { data: insertedWorkflows, error: insertError } = await supabase.from('product_workflows').insert(initialStepsToInsert).select();
                if (insertError) throw insertError;
                
                insertedWorkflows.forEach((realWf, index) => {
                    const tempId = newWorkflowSteps[index].temp_id;
                    existingWorkflowSteps.push({ ...newWorkflowSteps[index], id: realWf.id, temp_id: tempId });
                });
            }

            const updatePromises = existingWorkflowSteps.map(wf => {
                const translatedPrerequisites = (wf.prerequisites || []).map(prereqId => {
                    const newStep = existingWorkflowSteps.find(nws => nws.temp_id === prereqId);
                    return newStep ? newStep.id : prereqId;
                }).filter(Boolean);
                return supabase.from('product_workflows').update({ prerequisites: translatedPrerequisites, task_id: wf.task_id, is_optional: wf.is_optional }).eq('id', wf.id);
            });
            await Promise.all(updatePromises);
            
            return res.status(200).json({ message: 'Producto actualizado' });
        }

        if (req.method === 'DELETE') {
            const { id } = JSON.parse(req.body);
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