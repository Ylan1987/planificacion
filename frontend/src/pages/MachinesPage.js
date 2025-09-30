import React, { useState, useEffect } from 'react';
import '../App.css';

// --- Iconos ---
const IconoGuardar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const IconoDescartar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconoEliminar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

// --- Componente del Formulario de Edición/Creación ---
function MachineForm({ initialData, tasks, onSave, onCancel }) {
    const [machine, setMachine] = useState(initialData);

    const handleMachineFieldChange = (field, value) => {
        setMachine(prev => ({ ...prev, [field]: value }));
    };

    const handleTaskFieldChange = (taskIndex, field, value) => {
        const updatedTasks = [...machine.tasks];
        updatedTasks[taskIndex][field] = value;
        setMachine(prev => ({ ...prev, tasks: updatedTasks }));
    };
    
    const handleWorkTimeRuleChange = (taskIndex, ruleField, ruleValue) => {
        const updatedTasks = [...machine.tasks];
        let newRules = { ...updatedTasks[taskIndex].work_time_rules, [ruleField]: ruleValue };

        // Lógica para limpiar el estado anidado al cambiar una opción principal
        if (ruleField === 'mode') {
            newRules = { mode: ruleValue }; // Resetea las reglas si cambia el modo principal
        } else if (ruleField === 'passes_mode') {
            newRules = { ...newRules, size_mode: undefined, size_rules: [], time_independent_of_size: undefined };
        }
        
        updatedTasks[taskIndex].work_time_rules = newRules;
        setMachine(prev => ({ ...prev, tasks: updatedTasks }));
    };
    
    const handleSizeRuleChange = (taskIndex, ruleIndex, field, value) => {
        const updatedTasks = [...machine.tasks];
        updatedTasks[taskIndex].work_time_rules.size_rules[ruleIndex][field] = value;
        setMachine(prev => ({ ...prev, tasks: updatedTasks }));
    };
    
    const addSizeRule = (taskIndex) => {
        const updatedTasks = [...machine.tasks];
        if (!updatedTasks[taskIndex].work_time_rules.size_rules) {
            updatedTasks[taskIndex].work_time_rules.size_rules = [];
        }
        updatedTasks[taskIndex].work_time_rules.size_rules.push({ up_to_size: '', time: 0 });
        setMachine(prev => ({ ...prev, tasks: updatedTasks }));
    };

    const removeSizeRule = (taskIndex, ruleIndex) => {
        const updatedTasks = [...machine.tasks];
        updatedTasks[taskIndex].work_time_rules.size_rules.splice(ruleIndex, 1);
        setMachine(prev => ({ ...prev, tasks: updatedTasks }));
    };

    const addTask = () => {
        const newTask = { task_id: '', setup_time: 0, finish_time: 0, work_time_rules: { mode: 'unidad' } };
        setMachine(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    };

    const removeTask = (index) => {
        const updatedTasks = machine.tasks.filter((_, i) => i !== index);
        setMachine(prev => ({ ...prev, tasks: updatedTasks }));
    };

    return (
        <div className="card card-edit">
            <div className="card-content">
                <label>Nombre de la Máquina</label>
                <input type="text" value={machine.name} onChange={(e) => handleMachineFieldChange('name', e.target.value)} autoFocus />
                <hr />
                <h4>Tareas y Tiempos</h4>
                {machine.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="task-rule-form">
                        <div className="form-row">
                            <select value={task.task_id} onChange={(e) => handleTaskFieldChange(taskIndex, 'task_id', e.target.value)}>
                                <option value="">-- Seleccionar Tarea --</option>
                                {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <button onClick={() => removeTask(taskIndex)} className="delete-icon-small"><IconoEliminar /></button>
                        </div>
                        <div className="form-row">
                            <div><label>T. Arranque (min)</label><input type="number" value={task.setup_time || 0} onChange={(e) => handleTaskFieldChange(taskIndex, 'setup_time', parseFloat(e.target.value) || 0)} /></div>
                            <div><label>T. Finalización (min)</label><input type="number" value={task.finish_time || 0} onChange={(e) => handleTaskFieldChange(taskIndex, 'finish_time', parseFloat(e.target.value) || 0)} /></div>
                        </div>
                        <label>Modalidad de Tiempo de Trabajo</label>
                        <select value={task.work_time_rules.mode} onChange={(e) => handleWorkTimeRuleChange(taskIndex, 'mode', e.target.value)}>
                            <option value="hoja">Por Hoja</option>
                            <option value="unidad">Por Unidad</option>
                            <option value="bloque">Por Bloque</option>
                        </select>

                        {task.work_time_rules.mode === 'hoja' && <input type="number" placeholder="Tiempo por hoja" value={task.work_time_rules.timePerSheet || ''} onChange={e => handleWorkTimeRuleChange(taskIndex, 'timePerSheet', parseFloat(e.target.value) || 0)} />}
                        {task.work_time_rules.mode === 'unidad' && <input type="number" placeholder="Tiempo por unidad" value={task.work_time_rules.timePerUnit || ''} onChange={e => handleWorkTimeRuleChange(taskIndex, 'timePerUnit', parseFloat(e.target.value) || 0)} />}
                        
                        {task.work_time_rules.mode === 'bloque' && (
                            <>
                                <label>Configuración del Bloque</label>
                                <select value={task.work_time_rules.passes_mode || ''} onChange={(e) => handleWorkTimeRuleChange(taskIndex, 'passes_mode', e.target.value)}>
                                    <option value="">-- Seleccionar --</option>
                                    <option value="con_pasadas">Por cantidad de pasadas</option>
                                    <option value="sin_pasadas">Sin importar las pasadas</option>
                                </select>
                                
                                {task.work_time_rules.passes_mode === 'con_pasadas' && <input type="number" placeholder="Cantidad de pasadas" value={task.work_time_rules.passes_count || ''} onChange={e => handleWorkTimeRuleChange(taskIndex, 'passes_count', parseInt(e.target.value, 10) || 0)} />}
                                {task.work_time_rules.passes_mode === 'sin_pasadas' && (
                                    <select value={task.work_time_rules.size_mode || ''} onChange={(e) => handleWorkTimeRuleChange(taskIndex, 'size_mode', e.target.value)}>
                                        <option value="">-- Seleccionar --</option>
                                        <option value="dependiente">Por tamaño</option>
                                        <option value="independiente">No importa el tamaño</option>
                                    </select>
                                )}
                                {task.work_time_rules.size_mode === 'dependiente' && (
                                    <div className="size-rules">
                                        {(task.work_time_rules.size_rules || []).map((rule, ruleIndex) => (
                                            <div key={ruleIndex} className="form-row">
                                                <input type="text" placeholder="Hasta tal tamaño (ej: 70x100)" value={rule.up_to_size} onChange={e => handleSizeRuleChange(taskIndex, ruleIndex, 'up_to_size', e.target.value)} />
                                                <input type="number" placeholder="Tiempo" value={rule.time} onChange={e => handleSizeRuleChange(taskIndex, ruleIndex, 'time', parseFloat(e.target.value) || 0)} />
                                                <button onClick={() => removeSizeRule(taskIndex, ruleIndex)} className="delete-icon-small">X</button>
                                            </div>
                                        ))}
                                        <button onClick={() => addSizeRule(taskIndex)} className="add-button-small">+ Añadir Rango de Tamaño</button>
                                    </div>
                                )}
                                {task.work_time_rules.size_mode === 'independiente' && <input type="number" placeholder="Tiempo por bloque" value={task.work_time_rules.time_independent_of_size || ''} onChange={e => handleWorkTimeRuleChange(taskIndex, 'time_independent_of_size', parseFloat(e.target.value) || 0)} />}
                            </>
                        )}
                    </div>
                ))}
                <button onClick={addTask} className="add-button-small">+ Añadir Asignación de Tarea</button>
            </div>
            <div className="card-actions">
                <button onClick={() => onSave(machine)} title="Guardar"><IconoGuardar /></button>
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
    const [editingMachine, setEditingMachine] = useState(null);

    const fetchData = async () => { /* ... (código sin cambios) */ };
    useEffect(() => { fetchData(); }, []);
    
    const handleSaveMachine = async (machineData) => { /* ... (código sin cambios) */ };
    const handleDeleteMachine = async (id) => { /* ... (código sin cambios) */ };

    const handleAddNew = () => setEditingMachine({ id: null, name: '', tasks: [] });

    if (editingMachine) {
        return <div className="app-container"><MachineForm initialData={editingMachine} tasks={tasks} onSave={handleSaveMachine} onCancel={() => setEditingMachine(null)} /></div>;
    }

    return (
        <div className="app-container">
            <header>
                <h1>Configurar Máquinas</h1>
                <button className="add-button" onClick={handleAddNew}>+ Nueva Máquina</button>
            </header>
            {isLoading ? <p>Cargando...</p> : (
                <main className="grid-container">
                    {machines.map(machine => (
                        <div key={machine.id} className="card" onClick={() => setEditingMachine({ ...machine, tasks: machine.machine_tasks.map(mt => ({ task_id: mt.task_id, setup_time: mt.setup_time, finish_time: mt.finish_time, work_time_rules: mt.work_time_rules })) })}>
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