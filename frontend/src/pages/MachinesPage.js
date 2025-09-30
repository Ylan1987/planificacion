import React, { useState, useEffect } from 'react';
import '../App.css';

// --- Iconos ---
const IconoGuardar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const IconoDescartar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconoEliminar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

// --- Componente del Formulario de Edición/Creación ---
function MachineForm({ initialData, tasks, onSave, onCancel }) {
    const [machine, setMachine] = useState(initialData);

    const handleNameChange = (e) => {
        setMachine({ ...machine, name: e.target.value });
    };

    const handleTaskChange = (index, field, value) => {
        const updatedTasks = [...machine.tasks];
        updatedTasks[index][field] = value;
        setMachine({ ...machine, tasks: updatedTasks });
    };
    
    const handleWorkTimeRuleChange = (taskIndex, ruleField, ruleValue) => {
        const updatedTasks = [...machine.tasks];
        const newRules = { ...updatedTasks[taskIndex].work_time_rules, [ruleField]: ruleValue };

        // Lógica para limpiar reglas viejas al cambiar de modo
        if (ruleField === 'mode') {
            const rulesToKeep = { mode: ruleValue };
            updatedTasks[taskIndex].work_time_rules = rulesToKeep;
        } else {
            updatedTasks[taskIndex].work_time_rules = newRules;
        }
        
        setMachine({ ...machine, tasks: updatedTasks });
    };

    const addTask = () => {
        const newTask = {
            task_id: '',
            setup_time: 0,
            finish_time: 0,
            work_time_rules: { mode: 'unidad' }
        };
        setMachine({ ...machine, tasks: [...machine.tasks, newTask] });
    };

    const removeTask = (index) => {
        const updatedTasks = machine.tasks.filter((_, i) => i !== index);
        setMachine({ ...machine, tasks: updatedTasks });
    };

    const handleSave = () => {
        if (!machine.name.trim()) {
            alert('El nombre es requerido.');
            return;
        }
        onSave(machine);
    };

    return (
        <div className="card card-edit">
            <div className="card-content">
                <label>Nombre de la Máquina</label>
                <input type="text" value={machine.name} onChange={handleNameChange} autoFocus />

                <hr />
                <h4>Tareas y Tiempos</h4>
                {machine.tasks.map((task, index) => (
                    <div key={index} className="task-rule-form">
                        <select value={task.task_id} onChange={(e) => handleTaskChange(index, 'task_id', e.target.value)}>
                            <option value="">-- Seleccionar Tarea --</option>
                            {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button onClick={() => removeTask(index)} className="delete-icon-small"><IconoEliminar /></button>
                        
                        <label>Tiempo de Arranque (min)</label>
                        <input type="number" value={task.setup_time} onChange={(e) => handleTaskChange(index, 'setup_time', parseFloat(e.target.value) || 0)} />
                        
                        <label>Tiempo de Finalización (min)</label>
                        <input type="number" value={task.finish_time} onChange={(e) => handleTaskChange(index, 'finish_time', parseFloat(e.target.value) || 0)} />

                        <label>Modalidad de Tiempo de Trabajo</label>
                        <select value={task.work_time_rules.mode} onChange={(e) => handleWorkTimeRuleChange(index, 'mode', e.target.value)}>
                            <option value="hoja">Por Hoja</option>
                            <option value="unidad">Por Unidad</option>
                            <option value="bloque">Por Bloque</option>
                        </select>

                        {/* Campos Condicionales */}
                        {task.work_time_rules.mode === 'hoja' && (
                            <input type="number" placeholder="Tiempo por hoja" value={task.work_time_rules.timePerSheet || ''} onChange={e => handleWorkTimeRuleChange(index, 'timePerSheet', parseFloat(e.target.value) || 0)} />
                        )}
                        {task.work_time_rules.mode === 'unidad' && (
                            <input type="number" placeholder="Tiempo por unidad" value={task.work_time_rules.timePerUnit || ''} onChange={e => handleWorkTimeRuleChange(index, 'timePerUnit', parseFloat(e.target.value) || 0)} />
                        )}
                        {task.work_time_rules.mode === 'bloque' && (
                            <>
                                <input type="number" placeholder="Tamaño del bloque" value={task.work_time_rules.blockSize || ''} onChange={e => handleWorkTimeRuleChange(index, 'blockSize', parseInt(e.target.value, 10) || 0)} />
                                <input type="number" placeholder="Tiempo por bloque" value={task.work_time_rules.timePerBlock || ''} onChange={e => handleWorkTimeRuleChange(index, 'timePerBlock', parseFloat(e.target.value) || 0)} />
                                <input type="number" placeholder="Cantidad de pasadas" value={task.work_time_rules.passes || ''} onChange={e => handleWorkTimeRuleChange(index, 'passes', parseInt(e.target.value, 10) || 0)} />
                            </>
                        )}
                    </div>
                ))}
                <button onClick={addTask} className="add-button-small">+ Añadir Tarea</button>
            </div>
            <div className="card-actions">
                <button onClick={handleSave} title="Guardar"><IconoGuardar /></button>
                <button onClick={onCancel} title="Cancelar"><IconoDescartar /></button>
            </div>
        </div>
    );
}


// --- Componente Principal de la PÁGINA de Máquinas ---
export default function MachinesPage() {
    const [machines, setMachines] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingMachine, setEditingMachine] = useState(null); // Para saber qué máquina editamos o si creamos una nueva

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [machinesRes, tasksRes] = await Promise.all([ fetch('/api/machines'), fetch('/api/tasks') ]);
            const machinesData = await machinesRes.json();
            const tasksData = await tasksRes.json();
            setMachines(machinesData);
            setTasks(tasksData);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    
    const handleSaveMachine = async (machineData) => {
        const isCreating = !machineData.id;
        const method = isCreating ? 'POST' : 'PUT';
        const tasksToSave = machineData.tasks.map(({ task_id, setup_time, finish_time, work_time_rules }) => ({ task_id, setup_time, finish_time, work_time_rules }));
        const payload = { ...machineData, tasks: tasksToSave };

        try {
            const response = await fetch('/api/machines', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            
            setEditingMachine(null);
            fetchData();
        } catch (error) {
            console.error("Error al guardar la máquina:", error);
        }
    };

    const handleDeleteMachine = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta máquina?")) return;
        try {
            await fetch('/api/machines', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            fetchData();
        } catch (error) {
            console.error("Error al eliminar la máquina:", error);
        }
    };

    const handleAddNew = () => {
        setEditingMachine({ id: null, name: '', tasks: [] });
    };

    // Si estamos editando o creando, mostramos el formulario
    if (editingMachine) {
        return (
            <div className="app-container">
                 <MachineForm 
                    initialData={editingMachine}
                    tasks={tasks}
                    onSave={handleSaveMachine}
                    onCancel={() => setEditingMachine(null)}
                />
            </div>
        )
    }

    // Vista principal
    return (
        <div className="app-container">
            <header>
                <h1>Configurar Máquinas</h1>
                <button className="add-button" onClick={handleAddNew}>+ Nueva Máquina</button>
            </header>
            {isLoading ? <p>Cargando...</p> : (
                <main className="grid-container">
                    {machines.map(machine => (
                        <div key={machine.id} className="card" onClick={() => setEditingMachine({ ...machine, tasks: machine.machine_tasks })}>
                             <button className="delete-icon" onClick={(e) => { e.stopPropagation(); handleDeleteMachine(machine.id); }} title="Eliminar"><IconoEliminar /></button>
                             <div className="card-content">
                                 <span>{machine.name}</span>
                                 <div style={{ marginTop: '10px', fontSize: '14px', color: '#a0a0a0' }}>
                                     <strong>Tareas Asignadas:</strong>
                                     {machine.machine_tasks.length > 0 ? (
                                         <ul>{machine.machine_tasks.map(mt => <li key={mt.id}>{mt.tasks.name}</li>)}</ul>
                                     ) : <p>Ninguna</p>}
                                 </div>
                             </div>
                         </div>
                    ))}
                </main>
            )}
        </div>
    );
}