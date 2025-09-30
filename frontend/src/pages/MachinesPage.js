// frontend/src/pages/MachinesPage.js

import React, { useState, useEffect } from 'react';
import '../App.css';

// --- Iconos Requeridos ---
const IconoGuardar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const IconoDescartar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconoEliminar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

// --- Componente para la tarjeta de NUEVA MÁQUINA ---
function NewMachineCard({ onSave, onCancel }) {
    const [name, setName] = useState('');
    
    const handleSave = () => {
        if (!name.trim()) {
            alert('El nombre de la máquina es requerido.');
            return;
        }
        // Por ahora solo guardamos el nombre. Las tareas se añadirán en el modo de edición.
        onSave({ name, tasks: [] });
    };

    return (
        <div className="card card-new">
            <div className="card-content">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre de la nueva máquina"
                    autoFocus
                />
            </div>
            <div className="card-actions">
                <button onClick={handleSave} title="Guardar"><IconoGuardar /></button>
                <button onClick={onCancel} title="Cancelar"><IconoDescartar /></button>
            </div>
        </div>
    );
}

// --- Componente para una tarjeta de MÁQUINA EXISTENTE ---
function MachineCard({ machine, onDelete }) {
    return (
        <div className="card">
            <button className="delete-icon" onClick={() => onDelete(machine.id)} title="Eliminar"><IconoEliminar /></button>
            <div className="card-content">
                <span>{machine.name}</span>
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#a0a0a0' }}>
                    <strong>Tareas Asignadas:</strong>
                    {machine.machine_tasks.length > 0 ? (
                        <ul>
                            {machine.machine_tasks.map(mt => (
                                <li key={mt.id}>{mt.tasks.name}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>Ninguna</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Componente Principal de la PÁGINA de Máquinas ---
export default function MachinesPage() {
    const [machines, setMachines] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Función para obtener todos los datos
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [machinesRes, tasksRes] = await Promise.all([
                fetch('/api/machines'),
                fetch('/api/tasks')
            ]);
            const machinesData = await machinesRes.json();
            const tasksData = await tasksRes.json();
            setMachines(machinesData);
            setTasks(tasksData);
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    // Función para CREAR una nueva máquina
    async function handleCreateMachine(newMachine) {
        try {
            const response = await fetch('/api/machines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMachine)
            });
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            
            setIsCreating(false);
            fetchData(); // Recargamos todos los datos
        } catch (error) {
            console.error("Error al crear la máquina:", error);
        }
    }

    // Función para ELIMINAR una máquina
    async function handleDeleteMachine(id) {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta máquina?")) return;

        try {
            await fetch('/api/machines', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            
            // Actualizamos el estado local para una respuesta visual instantánea
            setMachines(machines.filter(m => m.id !== id));
        } catch (error) {
            console.error("Error al eliminar la máquina:", error);
        }
    }

    if (isLoading) {
        return <div className="app-container"><h1>Configurar Máquinas</h1><p>Cargando...</p></div>;
    }

    return (
        <div className="app-container">
            <header>
                <h1>Configurar Máquinas</h1>
                <button 
                    className="add-button" 
                    onClick={() => setIsCreating(true)}
                    disabled={isCreating}
                >
                    + Nueva Máquina
                </button>
            </header>
            <main className="grid-container">
                {isCreating && (
                    <NewMachineCard 
                        tasks={tasks}
                        onSave={handleCreateMachine}
                        onCancel={() => setIsCreating(false)}
                    />
                )}

                {machines.map(machine => (
                    <MachineCard 
                        key={machine.id}
                        machine={machine}
                        onDelete={handleDeleteMachine}
                    />
                ))}
            </main>
        </div>
    );
}