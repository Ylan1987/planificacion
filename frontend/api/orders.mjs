import { createClient } from '@supabase/supabase-js';

async function calculateTaskDetails(supabase, workflowTask, quantity, orderWidth, orderHeight, configs) {
    const taskId = workflowTask.task_id;
    console.log(`[LOG] Brain: Iniciando cálculo para Tarea ID ${taskId} | Cant: ${quantity} | Tamaño: ${orderWidth}x${orderHeight}`);

    let possible_resources = { machines: [], providers: [] };
    const { data: machineTasks, error: mtError } = await supabase.from('machine_tasks').select(`*, machine:machines(*)`).eq('task_id', taskId);
    if (mtError) throw mtError;

    if (machineTasks) {
        for (const mt of machineTasks) {
            console.log(`\n[LOG] -- Evaluando Máquina: ${mt.machine.name} --`);
            let duration = 0;
            const rules = mt.work_time_rules;
            
            if (!rules || !Array.isArray(rules) || rules.length === 0) {
                console.warn(`[WARN] SIN REGLAS: Máquina ${mt.machine.name} no tiene reglas de tiempo.`);
            } else {
                const jobMax = Math.max(orderWidth, orderHeight);
                const jobMin = Math.min(orderWidth, orderHeight);

                const survivingRules = rules.filter(rule => {
                    if (rule.size_w === 0 && rule.size_h === 0) return true;
                    const ruleMax = Math.max(rule.size_w, rule.size_h);
                    const ruleMin = Math.min(rule.size_w, rule.size_h);
                    return jobMax <= ruleMax && jobMin <= ruleMin;
                });
                
                console.log(`[LOG] Reglas que sobreviven para el tamaño del trabajo: ${survivingRules.length}`);

                let applicableRule = null;
                if (survivingRules.length > 0) {
                    applicableRule = survivingRules.sort((a, b) => b.rate - a.rate)[0];
                    console.log(`[LOG] ==> Regla más rápida seleccionada:`, applicableRule);

                    const { rate, mode, per_pass } = applicableRule;
                    if (rate > 0) {
                        if (mode === 'hoja' || mode === 'unidad') {
                            duration = (quantity / rate) * 60;
                        } else if (mode === 'bloque') {
                            const blockSize = configs.block_sizes?.[workflowTask.id] || 1;
                            duration = (blockSize > 0) ? (Math.ceil(quantity / blockSize) / rate) * 60 : 0;
                        }
                        if (per_pass) {
                            const passes = configs.passes?.[workflowTask.id] || 1;
                            duration *= passes;
                        }
                    }
                } else {
                    console.warn(`[WARN] NINGUNA REGLA SOBREVIVIÓ: No se encontró regla aplicable para el tamaño.`);
                }
            }

            const { data: skills } = await supabase.from('operator_skills').select('operator_id').eq('machine_id', mt.machine_id);
            const finalDuration = Math.round(duration);
            console.log(`[LOG] Duración final calculada para ${mt.machine.name}: ${finalDuration} minutos.`);
            
            possible_resources.machines.push({
                machine_id: mt.machine_id,
                machine_name: mt.machine.name,
                operator_ids: skills ? skills.map(s => s.operator_id) : [],
                duration_minutes: finalDuration
            });
        }
    }
    
    
    // Lógica de proveedores
    const { data: providerTasks } = await supabase.from('provider_tasks').select(`*, provider:providers(*)`).eq('task_id', taskId);
    if(providerTasks){
        for (const pt of providerTasks) {
            possible_resources.providers.push({
                provider_id: pt.provider_id,
                provider_name: pt.provider.name,
                duration_minutes: (pt.delivery_time_days || 1) * 24 * 60
            });
        }
    }
    
    return { possible_resources, prerequisites: workflowTask.prerequisites || [] };
}

export default async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[LOG] Petición recibida en orders.mjs: ${req.method}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            console.log("[LOG] GET: Obteniendo pedidos...");

            // --- CORRECCIÓN DE LA CONSULTA ---
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    product:products (
                        name,
                        product_workflows ( * )
                    ),
                    order_tasks ( *, task:tasks(name) )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log(`[LOG] GET: ${orders.length} pedidos encontrados. Enriqueciendo datos...`);
            
            for (const order of orders) {
                // El flujo de trabajo ahora viene anidado dentro del producto
                const productWorkflows = order.product.product_workflows;
                for (const orderTask of order.order_tasks) {
                    const workflowTask = productWorkflows.find(pwf => pwf.id === orderTask.product_workflow_id);
                    if (workflowTask) {
                        const details = await calculateTaskDetails(supabase, workflowTask, order.quantity, order.width, order.height, order.configs);
                        orderTask.possible_resources = details.possible_resources;
                    }
                }
            }

            console.log("[LOG] GET: Datos enriquecidos y listos para enviar.");
            return res.status(200).json(orders);
        }

        if (req.method === 'POST') {
            console.log("[LOG] POST: Iniciando creación de pedido...");
            const { productId, quantity, orderNumber, dueDate, width, height, configs } = req.body;
            console.log("[LOG] POST: Body recibido:", req.body);
            
            console.log("[LOG] POST: Paso 1 - Insertando pedido en la tabla 'orders'.");
            const { data: orderData, error: orderError } = await supabase.from('orders').insert({ product_id: productId, quantity, order_number: orderNumber, due_date: dueDate || null, width, height, configs }).select().single();
            if (orderError) {
                console.error("[ERROR] POST: Fallo al insertar en 'orders'.", orderError);
                throw orderError;
            }
            console.log(`[LOG] POST: Pedido ${orderData.id} creado en DB.`);

            console.log(`[LOG] POST: Paso 2 - Obteniendo flujo de trabajo para Producto ID ${productId}.`);
            const { data: productWorkflows, error: wfError } = await supabase.from('product_workflows').select(`*`).eq('product_id', productId);
            if (wfError) {
                console.error("[ERROR] POST: Fallo al obtener 'product_workflows'.", wfError);
                throw wfError;
            }
            console.log(`[LOG] POST: Flujo de trabajo encontrado con ${productWorkflows.length} pasos.`);
            
            console.log("[LOG] POST: Paso 3 - Filtrando tareas opcionales.");
            const finalWorkflow = productWorkflows.filter(wf => !wf.is_optional || configs.optional_tasks?.includes(wf.id));
            console.log(`[LOG] POST: Flujo final tiene ${finalWorkflow.length} pasos.`);
            
            const orderTasksToInsert = [];
            console.log("[LOG] POST: Paso 4 - Iterando sobre el flujo final para llamar a calculateTaskDetails.");
            for (const wf of finalWorkflow) {
                // Si este log no aparece, el problema está en los pasos anteriores.
                console.log(`[LOG] POST: Llamando a calculateTaskDetails para el paso de flujo con ID ${wf.id}.`);
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

            console.log(`[LOG] POST: Paso 5 - Insertando ${orderTasksToInsert.length} tareas planificables.`);
            if (orderTasksToInsert.length > 0) {
                const { error: insertTasksError } = await supabase.from('order_tasks').insert(orderTasksToInsert);
                if (insertTasksError) {
                    console.error("[ERROR] POST: Fallo al insertar 'order_tasks'.", insertTasksError);
                    throw insertTasksError;
                }
            }

            console.log("[LOG] POST: Proceso completado exitosamente.");
            return res.status(201).json(orderData);
        }
    } catch (error) {
        console.error('[ERROR] Error fatal en la función orders.js:', error);
        return res.status(500).json({ message: "Ocurrió un error en el servidor.", errorDetails: error.message });
    }
}