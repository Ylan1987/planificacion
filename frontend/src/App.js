// frontend/src/App.js - Versión MEJORADA para el backend local

import React, { useState, useEffect } from 'react';
import './App.css';

// --- Los componentes de íconos no cambian ---
const IconoGuardar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconoDescartar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L20.49 2M3.51 22a9 9 0 0 1-2.85-11.36"></path></svg>;
const IconoEliminar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

// --- Componente para una tarjeta de Tarea EXISTENTE ---
function TareaCard({ tarea, onSave, onDelete }) {
    // ... (Este componente no cambia)
    const [isEditing, setIsEditing] = useState(false);
    const [nombre, setNombre] = useState(tarea.nombre_tarea);
    const originalNombre = tarea.nombre_tarea;

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

// --- **NUEVO** Componente para la tarjeta de NUEVA TAREA ---
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

// --- Componente Principal ---
function App() {
    const [tareas, setTareas] = useState([]);
    const [isCreating, setIsCreating] = useState(false); // **NUEVO** estado para controlar la creación
    const API_URL = 'http://localhost:3001/api';

    useEffect(() => {
        fetch(`${API_URL}/tareas`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => setTareas(data.data))
            .catch(error => {
                console.error("Error al obtener tareas:", error);
                alert("No se pudo conectar al servidor. Asegúrate de que el proceso 'node server.js' esté corriendo.");
            });
    }, []);
    
    // **MODIFICADO** para manejar la nueva tarjeta
    const handleCrearTarea = (nombre_tarea) => {
        fetch(`${API_URL}/tareas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_tarea })
        })
        .then(res => res.json())
        .then(newTask => {
            setTareas([...tareas, newTask.data]);
            setIsCreating(false); // Ocultamos la tarjeta de creación
        });
    };

    const handleActualizarTarea = (id, nombre_tarea) => {
        // ... (Esta función no cambia)
        fetch(`${API_URL}/tareas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_tarea })
        })
        .then(() => {
            const nuevasTareas = tareas.map(t => t.id === id ? { ...t, nombre_tarea } : t);
            setTareas(nuevasTareas);
        });
    };
    
    const handleEliminarTarea = (id) => {
        // ... (Esta función no cambia)
        fetch(`${API_URL}/tareas/${id}`, { method: 'DELETE' })
        .then(() => {
            const nuevasTareas = tareas.filter(t => t.id !== id);
            setTareas(nuevasTareas);
        });
    };

    return (
        <div className="app-container">
            <header>
                <h1>Configurar Tareas</h1>
                {/* El botón ahora solo muestra/oculta la tarjeta de creación */}
                <button className="add-button" onClick={() => setIsCreating(true)} disabled={isCreating}>
                    + Nueva Tarea
                </button>
            </header>
            <main className="grid-container">
                {/* **NUEVA LÓGICA** para mostrar la tarjeta de creación */}
                {isCreating && (
                    <NuevaTareaCard 
                        onSave={handleCrearTarea} 
                        onCancel={() => setIsCreating(false)} 
                    />
                )}
                
                {tareas.map(tarea => (
                    <TareaCard 
                        key={tarea.id} 
                        tarea={tarea}
                        onSave={handleActualizarTarea}
                        onDelete={handleEliminarTarea}
                    />
                ))}
            </main>
        </div>
    );
}

export default App;