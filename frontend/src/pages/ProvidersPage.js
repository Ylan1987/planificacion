import React, { useState, useEffect } from 'react';
import '../App.css';

// --- Iconos ---
const IconoGuardar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const IconoDescartar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconoEliminar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

// --- Componente de Formulario ---
function ProviderForm({ initialData, tasks, onSave, onCancel }) {
    const [provider, setProvider] = useState(initialData);

    const handleFieldChange = (field, value) => setProvider(p => ({ ...p, [field]: value }));
    const handleTaskChange = (taskIndex, field, value) => {
        const newTasks = [...provider.tasks];
        newTasks[taskIndex][field] = value;
        setProvider(p => ({ ...p, tasks: newTasks }));
    };
    const addTask = () => setProvider(p => ({ ...p, tasks: [...p.tasks, { task_id: '', delivery_time_days: 0 }] }));
    const removeTask = (index) => setProvider(p => ({ ...p, tasks: p.tasks.filter((_, i) => i !== index) }));

    return (
        <div className="card card-edit">
            <div className="card-actions"><button onClick={() => onSave(provider)} title="Guardar"><IconoGuardar /></button><button onClick={onCancel} title="Cancelar"><IconoDescartar /></button></div>
            <div className="card-content">
                <label>Nombre del Proveedor</label>
                <input type="text" value={provider.name} onChange={(e) => handleFieldChange('name', e.target.value)} autoFocus />
                <hr style={{margin: '20px 0'}} />
                <h4>Tareas que realiza</h4>
                {provider.tasks.map((task, index) => (
                    <div key={index} className="task-rule-form">
                        <button onClick={() => removeTask(index)} className="delete-icon-small"><IconoEliminar /></button>
                        <div className="form-grid">
                            <div className="full-width"><label>Tarea</label><select value={task.task_id} onChange={(e) => handleTaskChange(index, 'task_id', e.target.value)}><option value="">-- Seleccionar --</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                            <div><label>Entrega (días hábiles)</label><input type="number" value={task.delivery_time_days || 0} onChange={(e) => handleTaskChange(index, 'delivery_time_days', parseInt(e.target.value, 10) || 0)} /></div>
                        </div>
                    </div>
                ))}
                <button onClick={addTask} className="add-button-small">+ Añadir Tarea</button>
            </div>
        </div>
    );
}

// --- Componente Principal de la Página ---
export default function ProvidersPage() {
    const [providers, setProviders] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingProviderId, setEditingProviderId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [providersRes, tasksRes] = await Promise.all([fetch('/api/providers'), fetch('/api/tasks')]);
            if (!providersRes.ok || !tasksRes.ok) throw new Error("API fetch failed");
            const providersData = await providersRes.json();
            const tasksData = await tasksRes.json();
            setProviders(providersData);
            setTasks(tasksData);
        } catch (error) { console.error("Error al cargar datos:", error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (providerData) => {
        const isCreating = !providerData.id;
        try {
            const response = await fetch('/api/providers', {
                method: isCreating ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(providerData)
            });
            if (!response.ok) throw new Error((await response.json()).message);
            setIsCreating(false);
            setEditingProviderId(null);
            fetchData();
        } catch (error) { alert(`Error al guardar: ${error.message}`); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este proveedor?")) return;
        try {
            await fetch('/api/providers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            fetchData();
        } catch (error) { alert(`Error al eliminar: ${error.message}`); }
    };
    
    const handleEdit = (provider) => {
        setEditingProviderId(provider.id);
        setIsCreating(false);
    };
    
    const handleCancel = () => {
        setIsCreating(false);
        setEditingProviderId(null);
    };

    return (
        <div className="app-container">
            <header><h1>Configurar Proveedores</h1><button className="add-button" onClick={() => setIsCreating(true)} disabled={isCreating || editingProviderId !== null}>+ Nuevo Proveedor</button></header>
            {isLoading ? <p>Cargando...</p> : (
                <main className="grid-container">
                    {isCreating && <ProviderForm initialData={{ id: null, name: '', tasks: [] }} tasks={tasks} onSave={handleSave} onCancel={handleCancel} />}
                    {providers.map(provider => (
                        editingProviderId === provider.id ? (
                            <ProviderForm key={provider.id} initialData={{...provider, tasks: provider.provider_tasks}} tasks={tasks} onSave={handleSave} onCancel={handleCancel}/>
                        ) : (
                            <div key={provider.id} className="card" onClick={() => handleEdit(provider)}>
                                <button className="delete-icon" onClick={(e) => { e.stopPropagation(); handleDelete(provider.id); }}><IconoEliminar /></button>
                                <div className="card-content">
                                    <span>{provider.name}</span>
                                    <div className="task-summary">
                                        <strong>Tareas:</strong>
                                        {provider.provider_tasks.length > 0 ? (<ul>{provider.provider_tasks.map(pt => <li key={pt.id}>{pt.tasks.name}</li>)}</ul>) : <span>Ninguna</span>}
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