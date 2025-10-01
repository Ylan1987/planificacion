import React, { useState, useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline/esnext';
import { DataSet } from 'vis-data/peer';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import moment from 'moment';
import '../App.css';
import CreateOrderModal from '../components/CreateOrderModal';

// --- Componente Modal para Asignar Operario ---
function AssignOperatorModal({ task, resource, operators, onSave, onCancel }) {
    const [selectedOperatorId, setSelectedOperatorId] = useState('');
    const availableOperators = operators.filter(op => resource.available_operator_ids.includes(op.id));

    useEffect(() => {
        if (availableOperators.length === 1) {
            setSelectedOperatorId(availableOperators[0].id);
        }
    }, [availableOperators]);

    const handleSave = () => {
        if (!selectedOperatorId) {
            alert("Por favor, selecciona un operario.");
            return;
        }
        onSave({
            order_task_id: task.id,
            start_time: resource.start,
            end_time: resource.end,
            machine_id: resource.machine_id,
            operator_id: parseInt(selectedOperatorId, 10),
        });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal card-edit">
                <h4>Asignar Operario para {task.task.name}</h4>
                <p>Máquina: <strong>{resource.machine_name}</strong></p>
                <p>Horario: <strong>{moment(resource.start).format('DD/MM HH:mm')}</strong> a <strong>{moment(resource.end).format('HH:mm')}</strong></p>
                <div className="form-section">
                    <label>Operario Disponible</label>
                    {availableOperators.length > 1 ? (
                        <select value={selectedOperatorId} onChange={(e) => setSelectedOperatorId(e.target.value)}>
                            <option value="">-- Seleccionar --</option>
                            {availableOperators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                        </select>
                    ) : (
                        <input type="text" value={availableOperators[0]?.name || 'No disponible'} readOnly />
                    )}
                </div>
                <div className="modal-actions">
                    <button onClick={onCancel}>Cancelar</button>
                    <button className="add-button" onClick={handleSave}>Confirmar</button>
                </div>
            </div>
        </div>
    );
}


// --- Componente Principal del Tablero ---
export default function PlanningBoardPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [operatorModalData, setOperatorModalData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [machines, setMachines] = useState([]);
    const [providers, setProviders] = useState([]);
    const [operators, setOperators] = useState([]);
    const [scheduledTasks, setScheduledTasks] = useState([]);
    const [planningTask, setPlanningTask] = useState(null);

    const timelineRef = useRef(null);
    const timelineInstance = useRef(null);
    const items = useRef(new DataSet());
    const groups = useRef(new DataSet());

    const timelineOptions = {
        stack: false,
        width: '100%',
        height: 'calc(100vh - 120px)',
        orientation: 'top',
        zoomMin: 1000 * 60 * 60,
        start: moment().startOf('day').toDate(),
        end: moment().startOf('day').add(1, 'week').toDate(),
    };

    const fetchData = async () => {
        try {
            const [ord, prod, mach, prov, ops, sched] = await Promise.all([
                fetch('/api/orders').then(res => res.json()),
                fetch('/api/products').then(res => res.json()),
                fetch('/api/machines').then(res => res.json()),
                fetch('/api/providers').then(res => res.json()),
                fetch('/api/operators').then(res => res.json()),
                fetch('/api/schedule').then(res => res.json()),
            ]);
            setOrders(ord || []);
            setProducts(prod || []);
            setMachines(mach || []);
            setProviders(prov || []);
            setOperators(ops || []);
            setScheduledTasks(sched || []);
        } catch(e) {
            console.error("Error fetching initial data", e);
        }
    };

    useEffect(() => { fetchData(); }, []);
    
    useEffect(() => {
        if (timelineRef.current) {
            timelineInstance.current = new Timeline(timelineRef.current, items.current, groups.current, timelineOptions);
            timelineInstance.current.on('doubleClick', (properties) => {
                const clickedItem = items.current.get(properties.item);
                if (clickedItem && clickedItem.type === 'background' && clickedItem.className === 'valid-slot') {
                    const resource = clickedItem.resource;
                    if (resource.provider_id) {
                        handleScheduleTask({
                            order_task_id: planningTask.id,
                            start_time: resource.start,
                            end_time: resource.end,
                            provider_id: resource.provider_id,
                        });
                    } else {
                        setOperatorModalData({ task: planningTask, resource });
                    }
                }
            });
        }
        return () => timelineInstance.current?.destroy();
    }, []);

    useEffect(() => {
        const groupData = [ ...(machines.map(m => ({ id: `m-${m.id}`, content: m.name })) || []), ...(providers.map(p => ({ id: `p-${p.id}`, content: p.name })) || []) ];
        groups.current.clear();
        groups.current.add(groupData);
    }, [machines, providers]);

    useEffect(() => {
        const itemData = (scheduledTasks || []).map(st => ({
            id: st.id,
            group: st.machine_id ? `m-${st.machine_id}` : `p-${st.provider_id}`,
            content: st.order_task.task.name,
            start: new Date(st.start_time),
            end: new Date(st.end_time),
            title: `Pedido: ${st.order_task.order_id}`
        }));
        const backgroundItems = items.current.get({ filter: item => item.type === 'background' });
        items.current.clear();
        items.current.add([...itemData, ...backgroundItems]);
    }, [scheduledTasks]);

    const isOperatorAvailable = (operatorId, start, end) => {
        const operator = operators.find(op => op.id === operatorId);
        if (!operator) return false;
        const startMoment = moment(start);
        const endMoment = moment(end);
        const dayOfWeek = startMoment.format('dddd').toLowerCase();
        const workSegments = operator.schedule?.[dayOfWeek];
        if (!workSegments || workSegments.length === 0) return false;
        let isInWorkHours = false;
        for (const segment of workSegments) {
            const segmentStart = startMoment.clone().startOf('day').add(moment.duration(segment.start));
            const segmentEnd = startMoment.clone().startOf('day').add(moment.duration(segment.end));
            if (startMoment.isSameOrAfter(segmentStart) && endMoment.isSameOrBefore(segmentEnd)) {
                isInWorkHours = true;
                break;
            }
        }
        if (!isInWorkHours) return false;
        const operatorTasks = scheduledTasks.filter(t => t.operator_id === operatorId);
        for (const task of operatorTasks) {
            if (startMoment < moment(task.end_time) && endMoment > moment(task.start_time)) return false;
        }
        return true;
    };

    const startPlanning = (task, order) => {
        console.log("%c--- INICIANDO PLANIFICACIÓN ---", "color: #03dac6; font-weight: bold;");
        console.log("Tarea a planificar:", task);
        setPlanningTask(task);
        
        const backgroundItems = items.current.get({ filter: item => item.type === 'background' });
        items.current.remove(backgroundItems.map(item => item.id));

        let lastPrereqEndTime = moment();
        if (task.prerequisites && task.prerequisites.length > 0) {
            task.prerequisites.forEach(prereqId => {
                const prereqOrderTask = order.order_tasks.find(ot => ot.product_workflow_id === prereqId);
                if (prereqOrderTask) {
                    const scheduledPrereq = scheduledTasks.find(st => st.order_task_id === prereqOrderTask.id);
                    if (scheduledPrereq && moment(scheduledPrereq.end_time).isAfter(lastPrereqEndTime)) {
                        lastPrereqEndTime = moment(scheduledPrereq.end_time);
                    }
                }
            });
        }
        console.log("Fin de prerrequisitos calculado:", lastPrereqEndTime.format('YYYY-MM-DD HH:mm'));

        const validSlots = [];
        console.log("Recursos posibles para la tarea:", task.possible_resources);
        task.possible_resources.machines.forEach(resource => {
            console.log(`%cBuscando huecos para Máquina: ${resource.machine_name}`, "color: #3f51b5;");
            const duration = resource.duration_minutes;
            if(!duration || duration <= 0) {
                console.warn(`[WARN] La duración para la máquina ${resource.machine_name} es 0 o inválida. Saltando.`);
                return;
            }
            const machineSchedule = scheduledTasks.filter(st => st.machine_id === resource.machine_id).sort((a,b) => new Date(a.start_time) - new Date(b.start_time));
            let searchStart = lastPrereqEndTime.clone();
            if (moment().isAfter(searchStart)) searchStart = moment();
            let limit = 100;

            while(limit > 0) {
                let proposedStart = searchStart.clone();
                let proposedEnd = proposedStart.clone().add(duration, 'minutes');
                let machineOverlap = false;
                for (const scheduled of machineSchedule) {
                    if (proposedStart < moment(scheduled.end_time) && proposedEnd > moment(scheduled.start_time)) {
                        machineOverlap = true;
                        searchStart = moment(scheduled.end_time);
                        break;
                    }
                }
                if (!machineOverlap) {
                    const availableOperatorsForSlot = resource.operator_ids.filter(opId => isOperatorAvailable(opId, proposedStart, proposedEnd));
                    if (availableOperatorsForSlot.length > 0) {
                        console.log(`[LOG] Slot válido encontrado para ${resource.machine_name} a las ${proposedStart.format('HH:mm')}`);
                        validSlots.push({
                            id: `slot-${resource.machine_id}-${proposedStart.valueOf()}`, group: `m-${resource.machine_id}`,
                            start: proposedStart.toDate(), end: proposedEnd.toDate(),
                            type: 'background', className: 'valid-slot',
                            resource: { ...resource, start: proposedStart.toDate(), end: proposedEnd.toDate(), available_operator_ids: availableOperatorsForSlot }
                        });
                        break;
                    }
                }
                if(machineOverlap) continue; // Si hubo overlap, reintenta desde el nuevo searchStart
                searchStart.add(30, 'minutes'); // Si no hay overlap pero no hay operarios, avanza 30 mins
                limit--;
            }
        });
        console.log("Total de slots válidos encontrados:", validSlots.length, validSlots);
        items.current.add(validSlots);
    };
    
    const cancelPlanning = () => {
        setPlanningTask(null);
        const backgroundItems = items.current.get({ filter: item => item.type === 'background' });
        items.current.remove(backgroundItems.map(item => item.id));
    };
    
    const handleScheduleTask = async (scheduleData) => {
        try {
            await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scheduleData) });
            setOperatorModalData(null);
            cancelPlanning();
            fetchData();
        } catch (error) { console.error("Error al agendar tarea:", error); alert("Error al agendar tarea."); }
    };
    
    const handleSaveOrder = async (orderData) => {
        try {
            await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
            setIsModalOpen(false);
            fetchData();
        } catch (error) { console.error("Error al crear pedido:", error); alert("Error al crear pedido."); }
    };

    const isTaskPlannable = (task, order) => {
        if (!task.prerequisites || task.prerequisites.length === 0) return true;
        const scheduledWorkflowIds = (order.order_tasks || []).filter(t => t.status === 'scheduled').map(t => t.product_workflow_id);
        return task.prerequisites.every(prereqId => scheduledWorkflowIds.includes(prereqId));
    };

    return (
        <div>
            {isModalOpen && <CreateOrderModal products={products} onClose={() => setIsModalOpen(false)} onSave={handleSaveOrder} />}
            {operatorModalData && <AssignOperatorModal {...operatorModalData} operators={operators} onSave={handleScheduleTask} onCancel={() => setOperatorModalData(null)} />}
            <div className="planning-page-header">
                <h1>Tablero General</h1>
                {planningTask ? ( <button className="add-button" style={{backgroundColor: 'var(--danger-color)'}} onClick={cancelPlanning}>Cancelar Planificación</button>
                ) : ( <button className="add-button" onClick={() => setIsModalOpen(true)}>+ Nuevo Pedido</button> )}
            </div>
            <div className="planning-page">
                <div className="orders-panel">
                    <h3>Pedidos Pendientes</h3>
                    {orders.filter(o => o.status === 'pending').map(order => (
                        <div key={order.id} className="order-card">
                            <h4>{order.order_number || `Pedido #${order.id}`} ({order.product?.name})</h4>
                            {(order.order_tasks || []).filter(t => t.status === 'pending').map(task => {
                                const isPlannable = isTaskPlannable(task, order);
                                return (
                                    <div key={task.id} className={`plannable-task ${!isPlannable && 'disabled'}`} title={isPlannable ? "Clic para planificar" : "Bloqueada por prerrequisitos"}>
                                        {isPlannable ? (
                                            <button onClick={() => startPlanning(task, order)}>{task.task?.name || 'N/A'}</button>
                                        ) : (
                                            <span>{task.task?.name || 'N/A'}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="gantt-panel" ref={timelineRef} />
            </div>
        </div>
    );
}