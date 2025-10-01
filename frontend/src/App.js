import React, { useState } from 'react';
import TasksPage from './pages/TasksPage';
import MachinesPage from './pages/MachinesPage';
import ProvidersPage from './pages/ProvidersPage';
import OperatorsPage from './pages/OperatorsPage';
import ProductsPage from './pages/ProductsPage'; // <-- Importar la nueva página
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('tasks');

  return (
    <div>
      <nav className="main-nav">
        <button onClick={() => setCurrentPage('tasks')}>Tareas</button>
        <button onClick={() => setCurrentPage('machines')}>Máquinas</button>
        <button onClick={() => setCurrentPage('providers')}>Proveedores</button>
        <button onClick={() => setCurrentPage('operators')}>Operarios</button>
        <button onClick={() => setCurrentPage('products')}>Productos</button> {/* <-- Añadir botón */}
      </nav>

      {currentPage === 'tasks' && <TasksPage />}
      {currentPage === 'machines' && <MachinesPage />}
      {currentPage === 'providers' && <ProvidersPage />}
      {currentPage === 'operators' && <OperatorsPage />}
      {currentPage === 'products' && <ProductsPage />} {/* <-- Añadir renderizado condicional */}
    </div>
  );
}

export default App;