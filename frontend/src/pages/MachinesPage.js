import React, { useState, useEffect } from 'react';
import '../App.css';

// --- Iconos ---
const IconoGuardar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const IconoDescartar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconoEliminar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

// --- Componente del Formulario (Corregido y Completo) ---
function MachineForm({ initialData, tasks, onSave, onCancel }) {
    const [machine, setMachine] = useState(initialData);

    const handleMachineFieldChange = (field, value) => setMachine(p => ({ ...p, [field]: value }));
    const handleTaskFieldChange = (taskIndex, field, value) => {
        const newTasks = [...machine.tasks];
        newTasks[taskIndex][field] = value;
        setMachine(p => ({ ...p, tasks: newTasks }));
    };
    const handleWorkTimeRuleChange = (taskIndex, field, value) => {
        const newTasks = [...machine.tasks];
        let newRules = { ...newTasks[taskIndex].work_time_rules, [field]: value };
        if (field === 'mode') newRules = { mode: value };
        newTasks[taskIndex].work_time_rules = newRules;
        setMachine(p => ({ ...p, tasks: newTasks }));
    };
    const handleBracketChange = (taskIndex, bracketIndex, field, value) => {
        const newTasks = [...machine.tasks];
        newTasks[taskIndex].work_time_rules.size_brackets[bracketIndex][field] = value;
        setMachine(p => ({ ...p, tasks: newTasks }));
    };
    const addBracket = (taskIndex) => {
        const newTasks = [...machine.tasks];
        if (!newTasks[taskIndex].work_time_rules.size_brackets) newTasks[taskIndex].work_time_rules.size_brackets = [];
        newTasks[taskIndex].work_time_rules.size_brackets.push({ size_w: 0, size_h: 0, rate: 0 });
        setMachine(p => ({ ...p, tasks: newTasks }));
    };
    const removeBracket = (taskIndex, bracketIndex) => {
        const newTasks = [...machine.tasks];
        newTasks[taskIndex].work_time_rules.size_brackets.splice(bracketIndex, 1);
        setMachine(p => ({ ...p, tasks: newTasks }));
    };
    const addTask = () => setMachine(p => ({ ...p, tasks: [...p.tasks, { task_id: '', setup_time: 0, finish_time: 0, work_time_rules: { mode: 'unidad' } }] }));
    const removeTask = (index) => setMachine(p => ({ ...p, tasks: p.tasks.filter((_, i) => i !== index) }));

    return (
        <div className="card card-edit">
            <div className="card-content">
                <div className="form-section">
                    <label>Nombre de la Máquina</label>
                    <input type="text" value={machine.name} onChange={(e) => handleMachineFieldChange('name', e.target.value)} autoFocus />
                </div>
                {machine.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="task-rule-form">
                        <div className="form-row space-between">
                            <div className="custom-select" style={{flex: 1}}>
                                <select value={task.task_id} onChange={(e) => handleTaskFieldChange(taskIndex, 'task_id', e.target.value)}>
                                    <option value="">-- Seleccionar Tarea --</option>
                                    {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <button onClick={() => removeTask(taskIndex)} className="delete-icon-small"><IconoEliminar /></button>
                        </div>
                        <div className="form-row">
                            <div><label>T. Arranque (min)</label><input type="number" value={task.setup_time || 0} onChange={(e) => handleTaskFieldChange(taskIndex, 'setup_time', parseFloat(e.target.value) || 0)} /></div>
                            <div><label>T. Finalización (min)</label><input type="number" value={task.finish_time || 0} onChange={(e) => handleTaskFieldChange(taskIndex, 'finish_time', parseFloat(e.target.value) || 0)} /></div>
                        </div>
                        <div className="form-section">
                            <div className="toggle-switch">
                                <input type="checkbox" id={`passes-${taskIndex}`} checked={task.work_time_rules.passes || false} onChange={e => handleWorkTimeRuleChange(taskIndex, 'passes', e.target.checked)} />
                                <label htmlFor={`passes-${taskIndex}`}></label>
                                <span>Afectado por Cantidad de Pasadas</span>
                            </div>
                            {task.work_time_rules.passes && <p className="helper-text">La cant/hora se dividirá por el n° de pasadas del trabajo.</p>}
                            <label>Cálculo de Tasa de Trabajo</label>
                            <div className="custom-select">
                                <select value={task.work_time_rules.mode} onChange={(e) => handleWorkTimeRuleChange(taskIndex, 'mode', e.target.value)}>
                                    <option value="hoja">Por Hoja</option><option value="unidad">Por Unidad</option><option value="bloque">Por Bloque</option>
                                </select>
                            </div>
                            <div className="custom-select">
                                <select value={task.work_time_rules.size_dependent || false} onChange={(e) => handleWorkTimeRuleChange(taskIndex, 'size_dependent', e.target.value === 'true')}>
                                    <option value="false">No importa el tamaño</option><option value="true">Depende del tamaño</option>
                                </select>
                            </div>
                            {task.work_time_rules.size_dependent === false && <><label>Cant. por Hora</label><input type="number" value={task.work_time_rules.rate || ''} onChange={e => handleWorkTimeRuleChange(taskIndex, 'rate', parseFloat(e.target.value) || 0)} /></>}
                            {task.work_time_rules.size_dependent === true && (
                                <div className="size-brackets">
                                    <label>Rangos de Tamaño y Cantidad</label>
                                    {(task.work_time_rules.size_brackets || []).map((bracket, bracketIndex) => (
                                        <div key={bracketIndex} className="bracket-row">
                                            <span>Hasta</span>
                                            <input type="number" placeholder="Ancho" value={bracket.size_w || ''} onChange={e => handleBracketChange(taskIndex, bracketIndex, 'size_w', parseInt(e.target.value, 10) || 0)} />
                                            <span>x</span>
                                            <input type="number" placeholder="Alto" value={bracket.size_h || ''} onChange={e => handleBracketChange(taskIndex, bracketIndex, 'size_h', parseInt(e.target.value, 10) || 0)} />
                                            <input type="number" placeholder="Cant/Hora" value={bracket.rate || ''} onChange={e => handleBracketChange(taskIndex, bracketIndex, 'rate', parseInt(e.target.value, 10) || 0)} />
                                            <button onClick={() => removeBracket(taskIndex, bracketIndex)} className="delete-icon-small">X</button>
                                        </div>
                                    ))}
                                    <button onClick={() => addBracket(taskIndex)} className="add-button-small">+ Añadir Rango</button>
                                    <p className="helper-text">Dejar Ancho y Alto en 0 para cualquier otro tamaño.</p>
                                </div>
                            )}
                        </div>
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
    const handleEdit = (machine) => { /* ... (código sin cambios) */ };

    if (editingMachine) {
        return <div className="app-container"><MachineForm initialData={editingMachine} tasks={tasks} onSave={handleSaveMachine} onCancel={() => setEditingMachine(null)} /></div>;
    }

    return (
        <div className="app-container">
            <header><h1>Configurar Máquinas</h1><button className="add-button" onClick={handleAddNew}>+ Nueva Máquina</button></header>
            {isLoading ? <p>Cargando...</p> : (
                <main className="grid-container">
                    {machines.map(machine => (
                        <div key={machine.id} className="card" onClick={() => handleEdit(machine)}>
                             <button className="delete-icon" onClick={(e) => { e.stopPropagation(); handleDeleteMachine(machine.id); }} title="Eliminar"><IconoEliminar /></button>
                             <div className="card-content">
                                 <span>{machine.name}</span>
                                 <div style={{ marginTop: '10px', fontSize: '14px', color: '#a0a0a0' }}>
                                     <strong>Tareas Asignadas:</strong>
                                     {machine.machine_tasks.length > 0 ? (<ul>{machine.machine_tasks.map(mt => <li key={mt.id}>{mt.tasks.name}</li>)}</ul>) : <p>Ninguna</p>}
                                 </div>
                             </div>
                         </div>
                    ))}
                </main>
            )}
        </div>
    );
}