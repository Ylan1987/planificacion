// frontend/src/App.js - Versión FINAL para Supabase y Vercel

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Importamos nuestro cliente de Supabase
import './App.css';

// --- Los componentes de íconos no cambian ---
const IconoGuardar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconoDescartar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L20.49 2M3.51 22a9 9 0 0 1-2.85-11.36"></path></svg>;
const IconoEliminar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;


// --- Componente para una tarjeta de Tarea EXISTENTE ---
function TareaCard({ tarea, onSave, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    // IMPORTANTE: El nombre de la columna en Supabase es 'name', no 'nombre_tarea'
    const [nombre, setNombre] = useState(tarea.name);
    const originalNombre = tarea.name;

    const handleGuardar = () => {
        onSave(tarea.id, nombre);
        setIsEditing(false);
    };
    const handleDescartar = () => {
        setNombre(originalNombre);
        setIsEditing(false);
    };
    const handleEliminar = () => {
        if (window.confirm(`¿Seguro que quieres eliminar "${originalNombre}"?`)) {
            onDelete(tarea.id);
        }
    };
    return (
        <div className="card">
            {isEditing && (
                <div className="card-actions">
                    <button onClick={handleGuardar} title="Guardar"><IconoGuardar /></button>
                    <button onClick={handleDescartar} title="Descartar"><IconoDescartar /></button>
                </div>
            )}
            <div className="card-content" onClick={() => setIsEditing(true)}>
                {isEditing ? (
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleGuardar()} />
                ) : (
                    <span>{nombre}</span>
                )}
            </div>
            {!isEditing && <button className="delete-icon" onClick={handleEliminar} title="Eliminar"><IconoEliminar /></button>}
        </div>
    );
}

// --- Componente para la tarjeta de NUEVA TAREA ---
function NuevaTareaCard({ onSave, onCancel }) {
    const [nombre, setNombre] = useState('');

    const handleGuardar = () => {
        if (nombre.trim()) {
            onSave(nombre.trim());
        }
    };
    
    return (
        <div className="card card-new">
            <div className="card-actions">
                <button onClick={handleGuardar} title="Guardar"><IconoGuardar /></button>
                <button onClick={onCancel} title="Cancelar"><IconoDescartar /></button>
            </div>
            <div className="card-content">
                <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre de la nueva tarea"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleGuardar()}
                />
            </div>
        </div>
    );
}


// --- Componente principal de la App, con la lógica de Supabase ---
function App() {
    const [tasks, setTasks] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    // useEffect para cargar las tareas al iniciar
    useEffect(() => {
        getTasks();
    }, []);

    // OBTENER todas las tareas de Supabase
    async function getTasks() {
        const { data, error } = await supabase.from('tasks').select().order('name');
        if (error) {
            console.error("Error al obtener tareas:", error);
        } else {
            setTasks(data);
        }
    }

    // CREAR una nueva tarea en Supabase
    async function handleCrearTarea(name) {
        const { data, error } = await supabase.from('tasks').insert({ name }).select();
        if (error) {
            console.error('Error al crear tarea:', error);
        } else {
            setTasks([...tasks, data[0]]);
            setIsCreating(false);
        }
    }

    // ACTUALIZAR una tarea en Supabase
    async function handleActualizarTarea(id, name) {
        const { error } = await supabase.from('tasks').update({ name }).eq('id', id);
        if (error) {
            console.error('Error al actualizar tarea:', error);
        } else {
            const nuevasTareas = tasks.map(t => t.id === id ? { ...t, name } : t);
            setTasks(nuevasTareas);
        }
    }
    
    // ELIMINAR una tarea de Supabase
    async function handleEliminarTarea(id) {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
            console.error('Error al eliminar tarea:', error);
        } else {
            const nuevasTareas = tasks.filter(t => t.id !== id);
            setTasks(nuevasTareas);
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
                {isCreating && (
                    <NuevaTareaCard 
                        onSave={handleCrearTarea} 
                        onCancel={() => setIsCreating(false)} 
                    />
                )}
                
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

export default App;