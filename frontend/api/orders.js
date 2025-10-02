import { createClient } from '@supabase/supabase-js';

// --- El "Cerebro": Motor de Cálculo ---
async function calculateTaskDetails(supabase, workflowTask, quantity, orderWidth, orderHeight, configs) {
    const taskId = workflowTask.task_id;
    console.log(`[LOG] Brain: Calculando detalles para Tarea ID ${taskId}`);
    console.log(`[LOG] Brain: Dimensiones del pedido: Ancho=${orderWidth}, Alto=${orderHeight}`);

    let possible_resources = { machines: [], providers: [] };

    const { data: machineTasks, error: mtError } = await supabase.from('machine_tasks').select(`*, machine:machines(*)`).eq('task_id', taskId);
    if (mtError) throw mtError;

    if (machineTasks) {
        for (const mt of machineTasks) {
            console.log(`\n[LOG] Evaluando Máquina: ${mt.machine.name}`);
            let duration = 0;
            const rules = mt.work_time_rules;

            if (!rules || rules.length === 0) {
                console.warn(`[WARN] Máquina ${mt.machine.name} no tiene reglas de tiempo.`);
                continue;
            }

            let applicableRule = null;
            const sortedRules = rules.sort((a, b) => (a.size_w * a.size_h) - (b.size_w * b.size_h));
            console.log(`[LOG] Reglas de tiempo encontradas y ordenadas:`, sortedRules);

            for (const rule of sortedRules) {
                console.log(`[LOG] -> Comparando con regla: Hasta ${rule.size_w}x${rule.size_h}`);
                if ((rule.size_w === 0 && rule.size_h === 0) || (orderWidth <= rule.size_w && orderHeight <= rule.size_h)) {
                    applicableRule = rule;
                    console.log(`[LOG] ==> ¡Regla encontrada!`, applicableRule);
                    break;
                }
            }

            if (applicableRule && applicableRule.rate > 0) {
                const { rate, mode, per_pass } = applicableRule;
                console.log(`[LOG] Tarea ${taskId}, Máquina ${mt.machine.name}: Regla aplicable encontrada. Tasa: ${rate} uds/hr.`);

                if (mode === 'hoja' || mode === 'unidad') {
                    duration = (quantity / rate) * 60; // en minutos
                } else if (mode === 'bloque') {
                    const blockSize = configs.block_sizes?.[workflowTask.id] || 1;
                    duration = (blockSize > 0) ? (Math.ceil(quantity / blockSize) / rate) * 60 : 0;
                }

                if (per_pass) {
                    const passes = configs.passes?.[workflowTask.id] || 1;
                    duration *= passes;
                    console.log(`[LOG] Tarea ${taskId} afectada por ${passes} pasadas. Duración ajustada: ${duration}`);
                }
            } else {
                 console.warn(`[WARN] No se encontró tasa de trabajo aplicable para Tarea ${taskId} en Máquina ${mt.machine.name}`);
            }

            const { data: skills } = await supabase.from('operator_skills').select('operator_id').eq('machine_id', mt.machine_id);
            
            possible_resources.machines.push({
                machine_id: mt.machine_id,
                machine_name: mt.machine.name,
                operator_ids: skills ? skills.map(s => s.operator_id) : [],
                duration_minutes: Math.round(duration)
            });
        }
    }
    
    // 2. Buscar proveedores que pueden hacer la tarea
    const { data: providerTasks, error: ptError } = await supabase.from('provider_tasks').select(`*, provider:providers(*)`).eq('task_id', taskId);
    if (ptError) { console.error('Error buscando provider_tasks:', ptError); throw ptError; }

    if(providerTasks){
        for (const pt of providerTasks) {
            possible_resources.providers.push({
                provider_id: pt.provider_id,
                provider_name: pt.provider.name,
                duration_minutes: (pt.delivery_time_days || 1) * 24 * 60
            });
        }
    }
    
    console.log(`[LOG] Brain: Detalles calculados para Tarea ${taskId}:`, JSON.stringify(possible_resources, null, 2));
    return { possible_resources, prerequisites: workflowTask.prerequisites || [] };
}


export default async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[LOG] Petición recibida en orders.js: ${req.method}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase.from('orders').select(`*, product:products(name), order_tasks(*, task:tasks(name))`).order('created_at', { ascending: false });
            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'POST') {
            const { productId, quantity, orderNumber, dueDate, width, height, configs } = req.body;
            
            const { data: orderData, error: orderError } = await supabase.from('orders').insert({ product_id: productId, quantity, order_number: orderNumber, due_date: dueDate, width, height, configs }).select().single();
            if (orderError) throw orderError;
            console.log(`[LOG] Pedido ${orderData.id} creado en DB.`);

            const { data: productWorkflows, error: wfError } = await supabase.from('product_workflows').select(`*`).eq('product_id', productId);
            if (wfError) throw wfError;

            const finalWorkflow = productWorkflows.filter(wf => !wf.is_optional || configs.optional_tasks?.includes(wf.id));
            
            const orderTasksToInsert = [];
            for (const wf of finalWorkflow) {
                const details = await calculateTaskDetails(supabase, wf, quantity, width, height, configs);
                orderTasksToInsert.push({
                    order_id: orderData.id,
                    product_workflow_id: wf.id,
                    task_id: wf.task_id,
                    possible_resources: details.possible_resources,
                    prerequisites: details.prerequisites,
                    status: 'pending'
                });
            }

            if (orderTasksToInsert.length > 0) {
                const { error: insertTasksError } = await supabase.from('order_tasks').insert(orderTasksToInsert);
                if (insertTasksError) throw insertTasksError;
                console.log(`[LOG] Generadas ${orderTasksToInsert.length} tareas planificables para pedido ${orderData.id}.`);
            }

            return res.status(201).json(orderData);
        }
    } catch (error) {
        console.error('[ERROR] Error en la función orders.js:', error);
        return res.status(500).json({ message: "Ocurrió un error en el servidor.", errorDetails: error.message });
    }
}