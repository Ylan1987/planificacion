// frontend/src/pages/MachinesPage.js

import React, { useState, useEffect } from 'react';
import '../App.css';

// Aquí irían los componentes de íconos, pero los omito por brevedad

export default function MachinesPage() {
    const [machines, setMachines] = useState([]);
    const [tasks, setTasks] = useState([]); // Lista de tareas disponibles
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Obtenemos máquinas y tareas en paralelo
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
        }
        fetchData();
    }, []);

    // La lógica para crear, editar y eliminar máquinas iría aquí
    // Por ahora, nos centramos en mostrar los datos

    if (isLoading) {
        return <div className="app-container">Cargando...</div>;
    }

    return (
        <div className="app-container">
            <header>
                <h1>Configurar Máquinas</h1>
                <button className="add-button">+ Nueva Máquina</button>
            </header>
            <main className="grid-container">
                {machines.map(machine => (
                    <div key={machine.id} className="card">
                        <div className="card-content">
                            <span>{machine.name}</span>
                            <div style={{ marginTop: '10px', fontSize: '14px', color: '#a0a0a0' }}>
                                <strong>Tareas Asignadas:</strong>
                                <ul>
                                    {machine.machine_tasks.map(mt => (
                                        <li key={mt.id}>{mt.tasks.name}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
}