import React, { useState } from 'react';
import TasksPage from './pages/TasksPage';
import MachinesPage from './pages/MachinesPage';
import ProvidersPage from './pages/ProvidersPage'; // <-- Importar la nueva página
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('tasks');

  return (
    <div>
      <nav className="main-nav">
        <button onClick={() => setCurrentPage('tasks')}>Tareas</button>
        <button onClick={() => setCurrentPage('machines')}>Máquinas</button>
        <button onClick={() => setCurrentPage('providers')}>Proveedores</button> {/* <-- Añadir botón */}
      </nav>

      {currentPage === 'tasks' && <TasksPage />}
      {currentPage === 'machines' && <MachinesPage />}
      {currentPage === 'providers' && <ProvidersPage />} {/* <-- Añadir renderizado condicional */}
    </div>
  );
}

export default App;