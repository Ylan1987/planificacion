import React, { useState, useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline'; // <-- CORRECCIÓN
import { DataSet } from 'vis-data';      // <-- CORRECCIÓN
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
                    {availableOperators.length > 0 ? (
                        <select value={selectedOperatorId} onChange={(e) => setSelectedOperatorId(e.target.value)}>
                            <option value="">-- Seleccionar --</option>
                            {availableOperators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                        </select>
                    ) : (
                        <input type="text" value={'No hay operarios disponibles'} readOnly />
                    )}
                </div>
                <div className="modal-actions">
                    <button onClick={onCancel}>Cancelar</button>
                    <button className="add-button" onClick={handleSave} disabled={availableOperators.length === 0}>Confirmar</button>
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
        stack: false, width: '100%', height: 'calc(100vh - 120px)',
        orientation: 'top', zoomMin: 1000 * 60 * 60,
        start: moment().startOf('day').toDate(),
        end: moment().startOf('day').add(1, 'week').toDate(),
    };

    const fetchData = async () => {
        try {
            const [ord, prod, mach, prov, ops, sched] = await Promise.all([
                fetch('/api/orders').then(res => res.json()), fetch('/api/products').then(res => res.json()),
                fetch('/api/machines').then(res => res.json()), fetch('/api/providers').then(res => res.json()),
                fetch('/api/operators').then(res => res.json()), fetch('/api/schedule').then(res => res.json()),
            ]);
            setOrders(ord || []); setProducts(prod || []); setMachines(mach || []);
            setProviders(prov || []); setOperators(ops || []); setScheduledTasks(sched || []);
        } catch(e) { console.error("Error fetching initial data", e); }
    };
    useEffect(() => { fetchData(); }, []);
    
    useEffect(() => {
        if (timelineRef.current && !timelineInstance.current) {
            timelineInstance.current = new Timeline(timelineRef.current, items.current, groups.current, timelineOptions);
        }

        const handleDoubleClick = (properties) => {
            if (!planningTask || !properties.item) return;
            const clickedItem = items.current.get(properties.item);

            if (clickedItem && clickedItem.type === 'background' && clickedItem.className === 'valid-slot') {
                const { resource, gapEnd } = clickedItem.slotInfo;
                const duration = resource.duration_minutes;
                const clickedTime = moment(properties.time);

                if (clickedTime.clone().add(duration, 'minutes').isAfter(gapEnd)) {
                    alert("La tarea no cabe en el espacio restante de este hueco.");
                    return;
                }

                const startTime = clickedTime.toDate();
                const endTime = clickedTime.clone().add(duration, 'minutes').toDate();
                
                const availableOperatorsForSlot = resource.operator_ids.filter(opId => isOperatorAvailable(opId, startTime, endTime));
                
                setOperatorModalData({ 
                    task: planningTask, 
                    resource: { ...resource, start: startTime, end: endTime, available_operator_ids: availableOperatorsForSlot } 
                });
            }
        };

        timelineInstance.current?.on('doubleClick', handleDoubleClick);
        return () => {
            timelineInstance.current?.off('doubleClick', handleDoubleClick);
        };
    }, [planningTask, operators, scheduledTasks]);

    useEffect(() => { /* ... (actualización de groups sin cambios) */ }, [machines, providers]);
    useEffect(() => { /* ... (actualización de items sin cambios) */ }, [scheduledTasks]);

    const isOperatorAvailable = (operatorId, start, end) => { /* ... (código sin cambios) */ };

    const startPlanning = async (task, order) => {
        setPlanningTask(task);
        const backgroundItems = items.current.get({ filter: item => item.type === 'background' });
        items.current.remove(backgroundItems.map(item => item.id));

        try {
            const response = await fetch('/api/calculate-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task, order, scheduledTasks, operators })
            });
            if (!response.ok) throw new Error("Error en el cálculo de slots");

            const possibilities = await response.json();
            console.log("Posibilidades recibidas:", possibilities);

            const slotsToDraw = [];
            possibilities.forEach(machinePossibility => {
                const machine = machines.find(m => m.name === machinePossibility.maquina);
                if (!machine) return;

                machinePossibility["Posibiilidades de la maquina"].forEach((slot, index) => {
                    const resource = task.possible_resources.machines.find(r => r.machine_id === machine.id);
                    slotsToDraw.push({
                        id: `slot-${machine.id}-${index}-${Date.now()}`,
                        group: `m-${machine.id}`,
                        start: new Date(slot.inicio),
                        end: new Date(slot.fin),
                        type: 'background',
                        className: 'valid-slot',
                        slotInfo: { resource, gapEnd: moment(slot.fin) }
                    });
                });
            });
            items.current.add(slotsToDraw);

        } catch (error) {
            console.error("Error al planificar:", error);
            alert("No se pudieron calcular los horarios disponibles.");
        }
    };
    
    const cancelPlanning = () => { /* ... (código sin cambios) */ };
    const handleScheduleTask = async (scheduleData) => { /* ... (código sin cambios) */ };
    const handleSaveOrder = async (orderData) => { /* ... (código sin cambios) */ };
    const isTaskPlannable = (task, order) => { /* ... (código sin cambios) */ };

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