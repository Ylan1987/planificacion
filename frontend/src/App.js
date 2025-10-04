import React, { useState } from 'react';
import TasksPage from './pages/TasksPage';
import MachinesPage from './pages/MachinesPage';
import ProvidersPage from './pages/ProvidersPage';
import OperatorsPage from './pages/OperatorsPage';
import ProductsPage from './pages/ProductsPage';
import PlanningBoardPage from './pages/PlanningBoardPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('planning');
  return (
    <div>
      <nav className="main-nav">
        <button onClick={() => setCurrentPage('planning')}>Tablero</button>
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
      {currentPage === 'planning' && <PlanningBoardPage />}
    </div>
  );
}
export default App;