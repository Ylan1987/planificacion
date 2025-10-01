import React, { useState, useEffect } from 'react';
import '../App.css';

// --- Iconos ---
const IconoGuardar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const IconoDescartar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconoEliminar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

// --- Componente del Formulario (Corregido) ---
function MachineForm({ initialData, tasks, onSave, onCancel }) {
    // ... (El código interno del formulario no necesita cambios, se mantiene igual que en la versión anterior)
    const [machine, setMachine] = useState(initialData);

    const handleFieldChange = (field, value) => setMachine(p => ({ ...p, [field]: value }));
    const handleTaskChange = (taskIndex, field, value) => {
        const newTasks = [...machine.tasks];
        newTasks[taskIndex][field] = value;
        setMachine(p => ({ ...p, tasks: newTasks }));
    };
    const addRule = (taskIndex) => {
        const newTasks = [...machine.tasks];
        if (!newTasks[taskIndex].work_time_rules) newTasks[taskIndex].work_time_rules = [];
        newTasks[taskIndex].work_time_rules.push({ size_w: 0, size_h: 0, mode: 'unidad', rate: 0, per_pass: false });
        setMachine(p => ({ ...p, tasks: newTasks }));
    };
    const removeRule = (taskIndex, ruleIndex) => {
        const newTasks = [...machine.tasks];
        newTasks[taskIndex].work_time_rules.splice(ruleIndex, 1);
        setMachine(p => ({ ...p, tasks: newTasks }));
    };
    const handleRuleChange = (taskIndex, ruleIndex, field, value) => {
        const newTasks = [...machine.tasks];
        newTasks[taskIndex].work_time_rules[ruleIndex][field] = value;
        setMachine(p => ({ ...p, tasks: newTasks }));
    };
    const addTask = () => setMachine(p => ({ ...p, tasks: [...p.tasks, { task_id: '', setup_time: 0, finish_time: 0, work_time_rules: [] }] }));
    const removeTask = (index) => setMachine(p => ({ ...p, tasks: p.tasks.filter((_, i) => i !== index) }));

    return (
        <div className="card card-edit">
             <div className="card-actions"><button onClick={() => onSave(machine)} title="Guardar"><IconoGuardar /></button><button onClick={onCancel} title="Cancelar"><IconoDescartar /></button></div>
             <div className="card-content">
                 <div className="form-section"><label>Nombre de la Máquina</label><input type="text" value={machine.name} onChange={(e) => handleFieldChange('name', e.target.value)} autoFocus /></div>
                 {machine.tasks.map((task, taskIndex) => (
                     <div key={taskIndex} className="task-rule-form">
                         <div className="form-row space-between">
                             <div className="custom-select" style={{flex: 1}}><select value={task.task_id} onChange={(e) => handleTaskChange(taskIndex, 'task_id', e.target.value)}><option value="">-- Seleccionar Tarea --</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                             <button onClick={() => removeTask(taskIndex)} className="delete-icon-small"><IconoEliminar /></button>
                         </div>
                         <div className="form-row">
                             <div><label>T. Arranque (min)</label><input type="number" value={task.setup_time || 0} onChange={(e) => handleTaskFieldChange(taskIndex, 'setup_time', parseFloat(e.target.value) || 0)} /></div>
                             <div><label>T. Finalización (min)</label><input type="number" value={task.finish_time || 0} onChange={(e) => handleTaskFieldChange(taskIndex, 'finish_time', parseFloat(e.target.value) || 0)} /></div>
                         </div>
                         <div className="form-section">
                             <label>Reglas de Tasa de Trabajo</label>
                             {(task.work_time_rules || []).map((rule, ruleIndex) => (
                                 <div key={ruleIndex} className="rule-row">
                                     <span>Hasta</span>
                                     <input type="number" placeholder="Ancho" value={rule.size_w || ''} onChange={e => handleRuleChange(taskIndex, ruleIndex, 'size_w', parseInt(e.target.value, 10) || 0)} />
                                     <span>x</span>
                                     <input type="number" placeholder="Alto" value={rule.size_h || ''} onChange={e => handleRuleChange(taskIndex, ruleIndex, 'size_h', parseInt(e.target.value, 10) || 0)} />
                                     <div className="custom-select"><select value={rule.mode} onChange={e => handleRuleChange(taskIndex, ruleIndex, 'mode', e.target.value)}><option value="hoja">p/ Hoja</option><option value="unidad">p/ Unidad</option><option value="bloque">p/ Bloque</option></select></div>
                                     <input type="number" placeholder="Cant/Hora" value={rule.rate || ''} onChange={e => handleRuleChange(taskIndex, ruleIndex, 'rate', parseInt(e.target.value, 10) || 0)} />
                                     <div className="toggle-switch small"><input type="checkbox" id={`pass-${taskIndex}-${ruleIndex}`} checked={rule.per_pass || false} onChange={e => handleRuleChange(taskIndex, ruleIndex, 'per_pass', e.target.checked)} /><label htmlFor={`pass-${taskIndex}-${ruleIndex}`}></label></div>
                                     <button onClick={() => removeRule(taskIndex, ruleIndex)} className="delete-icon-small"><IconoEliminar /></button>
                                 </div>
                             ))}
                             <button onClick={() => addRule(taskIndex)} className="add-button-small">+ Añadir Regla</button>
                             <p className="helper-text">Dejar Ancho y Alto en 0 para "cualquier tamaño". El toggle activa "¿La tasa es por cada pasada?".</p>
                         </div>
                     </div>
                 ))}
                 <button onClick={addTask} className="add-button-small">+ Añadir Asignación de Tarea</button>
             </div>
        </div>
    );
}


// --- Componente Principal (Lógica Corregida) ---
export default function MachinesPage() {
    const [machines, setMachines] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingMachineId, setEditingMachineId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const fetchData = async () => { /* ... (código sin cambios) */ };
    useEffect(() => { fetchData(); }, []);

    // --- CORRECCIÓN 4: Lógica de Guardado ---
    const handleSaveMachine = async (machineData) => {
        const isCreating = !machineData.id;
        const method = isCreating ? 'POST' : 'PUT';

        const tasksToSave = machineData.tasks.filter(t => t.task_id).map(({ task_id, setup_time, finish_time, work_time_rules }) => ({
            task_id: parseInt(task_id, 10),
            setup_time,
            finish_time,
            work_time_rules
        }));
        
        const payload = { ...machineData, tasks: tasksToSave };
        
        console.log("Guardando payload:", payload); // Log para depuración

        try {
            const response = await fetch('/api/machines', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error en la respuesta del servidor');
            }
            
            setIsCreating(false);
            setEditingMachineId(null);
            fetchData();
        } catch (error) {
            console.error("Error al guardar la máquina:", error);
            alert(`Error al guardar: ${error.message}`); // Muestra alerta si falla
        }
    };

    const handleDeleteMachine = async (id) => { /* ... (código sin cambios) */ };
    const handleAddNew = () => { setIsCreating(true); setEditingMachineId(null); };
    const handleEdit = (machine) => { setEditingMachineId(machine.id); setIsCreating(false); };
    const handleCancel = () => { setIsCreating(false); setEditingMachineId(null); };

    return (
        <div className="app-container">
            <header><h1>Configurar Máquinas</h1><button className="add-button" onClick={handleAddNew} disabled={isCreating || editingMachineId !== null}>+ Nueva Máquina</button></header>
            {isLoading ? <p>Cargando...</p> : (
                <main className="grid-container">
                    {/* --- CORRECCIÓN 3: Creación de tarjeta en línea --- */}
                    {isCreating && <MachineForm initialData={{ id: null, name: '', tasks: [] }} tasks={tasks} onSave={handleSaveMachine} onCancel={handleCancel} />}
                    
                    {machines.map(machine => (
                        // --- CORRECCIÓN 3: Edición en tarjeta del mismo tamaño ---
                        editingMachineId === machine.id ? (
                            <MachineForm 
                                key={machine.id} 
                                initialData={{ ...machine, tasks: machine.machine_tasks.map(mt => ({...mt})) }} 
                                tasks={tasks} 
                                onSave={handleSaveMachine} 
                                onCancel={handleCancel}
                            />
                        ) : (
                            <div key={machine.id} className="card" onClick={() => handleEdit(machine)}>
                                <button className="delete-icon" onClick={(e) => { e.stopPropagation(); handleDeleteMachine(machine.id); }}><IconoEliminar /></button>
                                <div className="card-content">
                                    <span>{machine.name}</span>
                                    <div className="task-summary">
                                        <strong>Tareas:</strong>
                                        {machine.machine_tasks.length > 0 ? (<ul>{machine.machine_tasks.map(mt => <li key={mt.id}>{mt.tasks.name}</li>)}</ul>) : <span>Ninguna</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </main>
            )}
        </div>
    );
}