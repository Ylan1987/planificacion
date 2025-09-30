// frontend/src/App.js - Nuestra interfaz con React

import React, { useState, useEffect } from 'react';
import './App.css'; // Importaremos estilos para que se vea bien

// --- Iconos Minimalistas (como componentes de React) ---
const IconoGuardar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconoDescartar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L20.49 2M3.51 22a9 9 0 0 1-2.85-11.36"></path></svg>;
const IconoEliminar = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;


// --- El Componente de la Tarjeta de Tarea ---
function TareaCard({ tarea, onSave, onDelete }) {
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
        if (window.confirm(`¿Estás seguro de que quieres eliminar la tarea "${originalNombre}"?`)) {
            onDelete(tarea.id);
        }
    };
    
    // NOTA DE PERMISOS: Aquí asumimos que el usuario es Administrador.
    // En el futuro, recibiríamos el rol del usuario y lo usaríamos así:
    // const esAdmin = usuario.rol === 'Administrador';
    // Y luego, por ejemplo:
    // {esAdmin && <div className="card-actions">...</div>}

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
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleGuardar()}
                    />
                ) : (
                    <span>{nombre}</span>
                )}
            </div>
            {!isEditing && (
                 <button className="delete-icon" onClick={handleEliminar} title="Eliminar"><IconoEliminar /></button>
            )}
        </div>
    );
}

// --- El Componente Principal de la Aplicación ---
function App() {
    const [tareas, setTareas] = useState([]);
    const API_URL = 'http://localhost:3001/api';

    useEffect(() => {
        fetch(`${API_URL}/tareas`)
            .then(res => res.json())
            .then(data => setTareas(data.data));
    }, []);

    const handleCrearTarea = () => {
        const nombre_tarea = prompt("Introduce el nombre de la nueva tarea:");
        if (nombre_tarea) {
            fetch(`${API_URL}/tareas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_tarea })
            })
            .then(res => res.json())
            .then(newTask => setTareas([...tareas, newTask.data]));
        }
    };

    const handleActualizarTarea = (id, nombre_tarea) => {
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
                <button className="add-button" onClick={handleCrearTarea}>+ Nueva Tarea</button>
            </header>
            <main className="grid-container">
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