import React, { useState, useEffect } from 'react';
import Timeline from 'vis-timeline-react';
import moment from 'moment';
import '../App.css';
import CreateOrderModal from '../components/CreateOrderModal';

export default function PlanningBoardPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [machines, setMachines] = useState([]);
    const [providers, setProviders] = useState([]);
    const [scheduledTasks, setScheduledTasks] = useState([]);
    
    const timelineOptions = {
        stack: false, width: '100%', height: 'calc(100vh - 120px)',
        orientation: 'top', zoomMin: 1000 * 60 * 60 * 24,
        start: moment().startOf('week').toDate(), end: moment().startOf('week').add(1, 'month').toDate(),
    };
    
    const timelineGroups = [
        ...(machines.map(m => ({ id: `m-${m.id}`, content: m.name })) || []),
        ...(providers.map(p => ({ id: `p-${p.id}`, content: p.name })) || [])
    ];
    const timelineItems = (scheduledTasks || []).map(st => ({
        id: st.id, group: st.machine_id ? `m-${st.machine_id}` : `p-${st.provider_id}`,
        content: st.order_task.task.name, start: new Date(st.start_time), end: new Date(st.end_time),
        title: `Pedido: ${st.order_task.order_id}`
    }));

    const fetchData = async () => {
        try {
            const [ord, prod, mach, prov, sched] = await Promise.all([
                fetch('/api/orders').then(res => res.json()),
                fetch('/api/products').then(res => res.json()),
                fetch('/api/machines').then(res => res.json()),
                fetch('/api/providers').then(res => res.json()),
                fetch('/api/schedule').then(res => res.json()),
            ]);
            setOrders(ord || []);
            setProducts(prod || []);
            setMachines(mach || []);
            setProviders(prov || []);
            setScheduledTasks(sched || []);
        } catch(e) {
            console.error("Error fetching initial data", e);
        }
    };

    useEffect(() => { fetchData(); }, []);
    
    const handleSaveOrder = async (orderData) => {
        try {
            await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error al crear pedido:", error);
            alert("Error al crear pedido.");
        }
    };
    
    const isTaskPlannable = (task, order) => {
        if (!task.prerequisites || task.prerequisites.length === 0) return true;
        const scheduledWorkflowIds = order.order_tasks.filter(t => t.status === 'scheduled').map(t => t.product_workflow_id);
        return task.prerequisites.every(prereqId => scheduledWorkflowIds.includes(prereqId));
    };

    return (
        <div>
            {isModalOpen && <CreateOrderModal products={products} onClose={() => setIsModalOpen(false)} onSave={handleSaveOrder} />}
            <div className="planning-page-header">
                <h1>Tablero General</h1>
                <button className="add-button" onClick={() => setIsModalOpen(true)}>+ Nuevo Pedido</button>
            </div>
            <div className="planning-page">
                <div className="orders-panel">
                    <h3>Pedidos Pendientes</h3>
                    {orders.filter(o => o.status === 'pending').map(order => (
                        <div key={order.id} className="order-card">
                            <h4>{order.order_number || `Pedido #${order.id}`} ({order.product?.name})</h4>
                            {(order.order_tasks || []).filter(t => t.status === 'pending').map(task => (
                                <div key={task.id} className={`plannable-task ${!isTaskPlannable(task, order) && 'disabled'}`}>
                                    {task.task?.name || 'Tarea Desconocida'}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="gantt-panel">
                    <Timeline options={timelineOptions} items={timelineItems} groups={timelineGroups} />
                </div>
            </div>
        </div>
    );
}