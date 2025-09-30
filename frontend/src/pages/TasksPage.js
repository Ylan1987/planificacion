// frontend/src/pages/TasksPage.js

import React, { useState, useEffect } from 'react';
import '../App.css'; // Reutilizamos los mismos estilos por ahora

// --- Iconos (pueden moverse a su propio archivo de componentes más adelante) ---
const IconoGuardar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconoDescartar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconoEliminar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

// --- Componente para una tarjeta de Tarea EXISTENTE ---
function TareaCard({ tarea, onSave, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [nombre, setNombre] = useState(tarea.name);
    const originalNombre = tarea.name;

    const handleGuardar = () => onSave(tarea.id, nombre);
    const handleDescartar = () => { setIsEditing(false); setNombre(originalNombre); };
    const handleEliminar = () => { if (window.confirm(`¿Seguro que quieres eliminar "${originalNombre}"?`)) onDelete(tarea.id); };

    return (
        <div className="card">
            {isEditing && (
                <div className="card-actions">
                    <button onClick={handleGuardar} title="Guardar"><IconoGuardar /></button>
                    <button onClick={handleDescartar} title="Descartar"><IconoDescartar /></button>
                </div>
            )}
            <div className="card-content" onClick={() => setIsEditing(true)}>
                {isEditing ? <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleGuardar()} /> : <span>{nombre}</span>}
            </div>
            {!isEditing && <button className="delete-icon" onClick={handleEliminar} title="Eliminar"><IconoEliminar /></button>}
        </div>
    );
}

// --- Componente para la tarjeta de NUEVA TAREA ---
function NuevaTareaCard({ onSave, onCancel }) {
    const [nombre, setNombre] = useState('');
    const handleGuardar = () => { if (nombre.trim()) onSave(nombre.trim()); };
    return (
        <div className="card card-new">
            <div className="card-actions">
                <button onClick={handleGuardar} title="Guardar"><IconoGuardar /></button>
                <button onClick={onCancel} title="Cancelar"><IconoDescartar /></button>
            </div>
            <div className="card-content">
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la nueva tarea" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleGuardar()} />
            </div>
        </div>
    );
}


// --- Componente Principal de la PÁGINA de Tareas ---
export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const API_URL = '/api'; 

    useEffect(() => {
        getTasks();
    }, []);

    async function getTasks() {
        try {
            const response = await fetch(`${API_URL}/tasks`);
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            const data = await response.json();
            setTasks(data);
        } catch (error) {
            console.error("Error al obtener tareas:", error);
        }
    }

    async function handleCrearTarea(name) {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            const newTask = await response.json();
            setTasks([...tasks, newTask]);
            setIsCreating(false);
        } catch (error) {
            console.error("Error al crear tarea:", error);
        }
    }

    async function handleActualizarTarea(id, name) {
        try {
            await fetch(`${API_URL}/tasks`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name })
            });
            const nuevasTareas = tasks.map(t => t.id === id ? { ...t, name } : t);
            setTasks(nuevasTareas);
        } catch (error) {
            console.error("Error al actualizar tarea:", error);
        }
    }

    async function handleEliminarTarea(id) {
        try {
            await fetch(`${API_URL}/tasks`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const nuevasTareas = tasks.filter(t => t.id !== id);
            setTasks(nuevasTareas);
        } catch (error) {
            console.error("Error al eliminar tarea:", error);
        }
    }

    return (
        <div className="app-container">
            <header>
                <h1>Configurar Tareas</h1>
                <button className="add-button" onClick={() => setIsCreating(true)} disabled={isCreating}>
                    + Nueva Tarea
                </button>
            </header>
            <main className="grid-container">
                {isCreating && <NuevaTareaCard onSave={handleCrearTarea} onCancel={() => setIsCreating(false)} />}
                {tasks.map(task => (
                    <TareaCard 
                        key={task.id} 
                        tarea={task}
                        onSave={handleActualizarTarea}
                        onDelete={handleEliminarTarea}
                    />
                ))}
            </main>
        </div>
    );
}