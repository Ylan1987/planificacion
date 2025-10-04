import React, { useState } from 'react';
// --- CORRECCIÓN: Añadidas las extensiones .js a todas las importaciones ---
import TasksPage from './pages/TasksPage.js';
import MachinesPage from './pages/MachinesPage.js';
import ProvidersPage from './pages/ProvidersPage.js';
import OperatorsPage from './pages/OperatorsPage.js';
import ProductsPage from './pages/ProductsPage.js';
import PlanningBoardPage from './pages/PlanningBoardPage.js';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('planning'); // <-- Página por defecto

  return (
    <div>
      <nav className="main-nav">
        <button onClick={() => setCurrentPage('planning')}>Tablero</button> {/* <-- Añadir botón */}
        <button onClick={() => setCurrentPage('tasks')}>Tareas</button>
        <button onClick={() => setCurrentPage('machines')}>Máquinas</button>
        <button onClick={() => setCurrentPage('providers')}>Proveedores</button>
        <button onClick={() => setCurrentPage('operators')}>Operarios</button>
        <button onClick={() => setCurrentPage('products')}>Productos</button>
      </nav>

      {currentPage === 'tasks' && <TasksPage />}
      {currentPage === 'machines' && <MachinesPage />}
      {currentPage === 'providers' && <ProvidersPage />}
      {currentPage === 'operators' && <OperatorsPage />}
      {currentPage === 'products' && <ProductsPage />}
      {currentPage === 'planning' && <PlanningBoardPage />} {/* <-- Añadir renderizado */}
    </div>
  );
}

export default App;