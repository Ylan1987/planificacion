import { createClient } from '@supabase/supabase-js';
import moment from 'moment';

// --- Funciones Auxiliares para Cálculo de Tiempo ---
const findGaps = (schedule, start, end, minDuration) => {
    let gaps = [];
    let lastEndTime = moment(start);
    const sortedSchedule = schedule.sort((a,b) => moment(a.start_time) - moment(b.start_time));

    for(const task of sortedSchedule) {
        const taskStart = moment(task.start_time);
        if (taskStart.diff(lastEndTime, 'minutes') >= minDuration) {
            gaps.push({ start: lastEndTime.clone(), end: taskStart.clone() });
        }
        lastEndTime = moment(task.end_time);
    }

    if(moment(end).diff(lastEndTime, 'minutes') >= minDuration) {
        gaps.push({ start: lastEndTime.clone(), end: moment(end) });
    }
    return gaps;
};

const findIntersection = (gapsA, gapsB) => {
    let intersection = [];
    for (const a of gapsA) {
        for (const b of gapsB) {
            const start = moment.max(a.start, b.start);
            const end = moment.min(a.end, b.end);
            if (start < end) {
                intersection.push({ start, end });
            }
        }
    }
    return intersection;
};


export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[LOG] calculate-slots: Petición recibida`);
    const { task, order, scheduledTasks, operators } = req.body;
    
    try {
        const results = [];
        const duration = task.possible_resources.machines.reduce((acc, m) => Math.max(acc, m.duration_minutes), 0);
        let earliestStart = moment(); // Aquí iría la lógica de prerrequisitos

        for (const resource of task.possible_resources.machines) {
            console.log(`[LOG] Calculando para Máquina ID ${resource.machine_id}`);
            let machineResult = { maquina: resource.machine_name, "Posibiilidades de la maquina": [], "Posibilidades por operario": [] };
            
            // 1. Calcular huecos de la máquina
            const machineSchedule = scheduledTasks.filter(st => st.machine_id === resource.machine_id);
            const machineGaps = findGaps(machineSchedule, earliestStart, earliestStart.clone().add(30, 'days'), duration);

            const allOperatorSlotsForThisMachine = [];

            // 2. Calcular huecos por operario
            for (const operatorId of resource.operator_ids) {
                const operator = operators.find(op => op.id === operatorId);
                if (!operator) continue;

                const operatorSchedule = scheduledTasks.filter(st => st.operator_id === operatorId);
                const operatorGeneralGaps = [];
                // Lógica para convertir el horario general del operario en huecos grandes
                const dayOfWeek = earliestStart.format('dddd').toLowerCase();
                (operator.schedule?.[dayOfWeek] || []).forEach(segment => {
                    const start = earliestStart.clone().startOf('day').add(moment.duration(segment.start));
                    const end = earliestStart.clone().startOf('day').add(moment.duration(segment.end));
                    operatorGeneralGaps.push({start, end});
                });

                const operatorTaskGaps = findGaps(operatorSchedule, earliestStart, earliestStart.clone().add(30, 'days'), duration);
                const operatorFreeTime = findIntersection(operatorGeneralGaps, operatorTaskGaps);

                // 3. Intersección: huecos de la máquina Y huecos del operario
                const finalOperatorSlots = findIntersection(machineGaps, operatorFreeTime);

                if (finalOperatorSlots.length > 0) {
                     machineResult["Posibilidades por operario"].push({
                        operario: operator.name,
                        Horarios: finalOperatorSlots.map(s => ({ inicio: s.start.format(), fin: s.end.format() }))
                    });
                    allOperatorSlotsForThisMachine.push(...finalOperatorSlots);
                }
            }

            // 4. Unión de todos los slots de operarios para esta máquina
            const unionOfSlots = []; // Lógica de unión de intervalos de tiempo
            // ...
            machineResult["Posibiilidades de la maquina"] = allOperatorSlotsForThisMachine.map(s => ({ inicio: s.start.format(), fin: s.end.format() }));

            if (machineResult["Posibilidades por operario"].length > 0) {
                results.push(machineResult);
            }
        }
        
        console.log("[LOG] calculate-slots: Cálculo finalizado.");
        return res.status(200).json(results);

    } catch (error) {
        console.error('[ERROR] Error en la función calculate-slots:', error);
        return res.status(500).json({ message: "Ocurrió un error en el cálculo.", errorDetails: error.message });
    }
}