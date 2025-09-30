// frontend/src/App.js

import React, { useState } from 'react';
import TasksPage from './pages/TasksPage';
import MachinesPage from './pages/MachinesPage'; // Importamos la nueva página
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('tasks'); // 'tasks' o 'machines'

  return (
    <div>
      <nav className="main-nav">
        <button onClick={() => setCurrentPage('tasks')}>Tareas</button>
        <button onClick={() => setCurrentPage('machines')}>Máquinas</button>
      </nav>

      {/* Muestra la página actual basado en el estado */}
      {currentPage === 'tasks' && <TasksPage />}
      {currentPage === 'machines' && <MachinesPage />}
    </div>
  );
}

export default App;