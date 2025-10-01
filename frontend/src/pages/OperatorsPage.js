import React, { useState, useEffect } from 'react';
import '../App.css';

// --- Iconos ---
const IconoGuardar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const IconoDescartar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconoEliminar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

// --- Componente para Selector con Chips ---
function SkillsSelector({ allMachines, selectedSkills, onChange }) {
    const handleSelect = (e) => {
        const selectedId = parseInt(e.target.value, 10);
        if (selectedId && !selectedSkills.includes(selectedId)) {
            onChange([...selectedSkills, selectedId]);
        }
    };
    const handleRemove = (idToRemove) => {
        onChange(selectedSkills.filter(id => id !== idToRemove));
    };
    const availableMachines = allMachines.filter(m => !selectedSkills.includes(m.id));
    return (
        <div className="skills-selector">
            <div className="chips-container">
                {selectedSkills.map(skillId => {
                    const machine = allMachines.find(m => m.id === skillId);
                    return (
                        <div key={skillId} className="chip">
                            {machine?.name || 'ID Desconocido'}
                            <button onClick={() => handleRemove(skillId)} className="chip-delete">×</button>
                        </div>
                    );
                })}
            </div>
            <select onChange={handleSelect} value="">
                <option value="">+ Añadir máquina...</option>
                {availableMachines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
        </div>
    );
}

// --- Componente de Formulario (Actualizado) ---
function OperatorForm({ initialData, machines, onSave, onCancel }) {
    const [operator, setOperator] = useState(initialData);
    const weekDays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

    const handleFieldChange = (field, value) => setOperator(p => ({ ...p, [field]: value }));
    const handleScheduleChange = (day, segmentIndex, field, value) => {
        const newSchedule = { ...operator.schedule };
        newSchedule[day][segmentIndex][field] = value;
        setOperator(p => ({ ...p, schedule: newSchedule }));
    };
    const addScheduleSegment = (day) => {
        const newSchedule = { ...operator.schedule };
        if (!newSchedule[day]) newSchedule[day] = [];
        newSchedule[day].push({ start: '09:00', end: '13:00' });
        setOperator(p => ({ ...p, schedule: newSchedule }));
    };
    const removeScheduleSegment = (day, segmentIndex) => {
        const newSchedule = { ...operator.schedule };
        newSchedule[day].splice(segmentIndex, 1);
        setOperator(p => ({ ...p, schedule: newSchedule }));
    };

    return (
        <div className="card card-edit">
            <div className="card-actions"><button onClick={() => onSave(operator)} title="Guardar"><IconoGuardar /></button><button onClick={onCancel} title="Cancelar"><IconoDescartar /></button></div>
            <div className="card-content">
                <div className="form-grid">
                    <div><label>Nombre del Operario</label><input type="text" value={operator.name} onChange={(e) => handleFieldChange('name', e.target.value)} autoFocus /></div>
                    <div><label>Tipo</label><select value={operator.type} onChange={(e) => handleFieldChange('type', e.target.value)}><option value="Mensual">Mensual</option><option value="Jornalero">Jornalero</option></select></div>
                </div>
                <div className="form-section">
                    <label>Máquinas que sabe manejar</label>
                    <SkillsSelector
                        allMachines={machines}
                        selectedSkills={operator.skills}
                        onChange={(newSkills) => handleFieldChange('skills', newSkills)}
                    />
                </div>
                <div className="form-section">
                    <label>Horario Semanal</label>
                    {weekDays.map(day => (
                        <div key={day} className="day-schedule">
                            <strong style={{textTransform: 'capitalize'}}>{day}</strong>
                            {(operator.schedule?.[day] || []).map((segment, index) => (
                                <div key={index} className="form-row">
                                    <input type="time" value={segment.start} onChange={e => handleScheduleChange(day, index, 'start', e.target.value)} />
                                    <span>-</span>
                                    <input type="time" value={segment.end} onChange={e => handleScheduleChange(day, index, 'end', e.target.value)} />
                                    <button onClick={() => removeScheduleSegment(day, index)} className="delete-icon-small"><IconoEliminar /></button>
                                </div>
                            ))}
                            <button onClick={() => addScheduleSegment(day)} className="add-button-small">+ Añadir Turno</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- Componente Principal de la Página ---
export default function OperatorsPage() {
    const [operators, setOperators] = useState([]);
    const [machines, setMachines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingOperatorId, setEditingOperatorId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [operatorsRes, machinesRes] = await Promise.all([fetch('/api/operators'), fetch('/api/machines')]);
            if (!operatorsRes.ok || !machinesRes.ok) throw new Error("API fetch failed");
            const operatorsData = await operatorsRes.json();
            const machinesData = await machinesRes.json();
            setOperators(operatorsData);
            setMachines(machinesData);
        } catch (error) { console.error("Error al cargar datos:", error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (operatorData) => {
        try {
            const response = await fetch('/api/operators', {
                method: isCreating ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(operatorData)
            });
            if (!response.ok) throw new Error((await response.json()).message);
            setIsCreating(false);
            setEditingOperatorId(null);
            fetchData();
        } catch (error) { alert(`Error al guardar: ${error.message}`); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este operario?")) return;
        try {
            await fetch('/api/operators', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            fetchData();
        } catch (error) { alert(`Error al eliminar: ${error.message}`); }
    };
    
    const handleEdit = (operator) => {
        setEditingOperatorId(operator.id);
        setIsCreating(false);
    };
    
    const handleCancel = () => {
        setIsCreating(false);
        setEditingOperatorId(null);
    };

    const handleAddNew = () => {
        setIsCreating(true);
        setEditingOperatorId(null);
    };

    return (
        <div className="app-container">
            <header><h1>Configurar Operarios</h1><button className="add-button" onClick={handleAddNew} disabled={isCreating || editingOperatorId !== null}>+ Nuevo Operario</button></header>
            {isLoading ? <p>Cargando...</p> : (
                <main className="grid-container">
                    {isCreating && <OperatorForm initialData={{ id: null, name: '', type: 'Mensual', schedule: {}, skills: [] }} machines={machines} onSave={handleSave} onCancel={handleCancel} />}
                    {operators.map(op => (
                        editingOperatorId === op.id ? (
                            <OperatorForm key={op.id} initialData={{ ...op, skills: op.operator_skills.map(s => s.machine_id) }} machines={machines} onSave={handleSave} onCancel={handleCancel} />
                        ) : (
                            <div key={op.id} className="card" onClick={() => handleEdit(op)}>
                                <button className="delete-icon" onClick={(e) => { e.stopPropagation(); handleDelete(op.id); }}><IconoEliminar /></button>
                                <div className="card-content">
                                    <span>{op.name} <small>({op.type})</small></span>
                                </div>
                            </div>
                        )
                    ))}
                </main>
            )}
        </div>
    );
}