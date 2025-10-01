import React, { useState, useEffect } from 'react';
import '../App.css';

// --- Iconos ---
const IconoGuardar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const IconoDescartar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconoEliminar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

// --- Componente Reutilizable para Selector con Chips (Corregido) ---
function ChipSelector({ options, selectedValues, onChange, placeholder }) {
    // --- CORRECCIÓN: Asegura que selectedValues sea siempre un array ---
    const currentValues = selectedValues || [];

    const handleSelect = (e) => {
        const selectedId = parseInt(e.target.value, 10);
        if (selectedId && !currentValues.includes(selectedId)) {
            onChange([...currentValues, selectedId]);
        }
        e.target.value = "";
    };
    const handleRemove = (idToRemove) => {
        onChange(currentValues.filter(id => id !== idToRemove));
    };
    const availableOptions = options.filter(opt => !currentValues.includes(opt.value));

    return (
        <div className="skills-selector">
            <div className="chips-container">
                {currentValues.map(value => { // Usa currentValues en lugar de selectedValues
                    const option = options.find(opt => opt.value === value);
                    return (
                        <div key={value} className="chip">
                            {option?.label || 'ID Desconocido'}
                            <button onClick={() => handleRemove(value)} className="chip-delete">×</button>
                        </div>
                    );
                })}
            </div>
            <select onChange={handleSelect} value="">
                <option value="">{placeholder || "+ Añadir..."}</option>
                {availableOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

// --- Componente de Formulario ---
function ProductForm({ initialData, allTasks, onSave, onCancel }) {
    const [product, setProduct] = useState(initialData);

    const handleFieldChange = (field, value) => setProduct(p => ({ ...p, [field]: value }));
    const handleWorkflowChange = (index, field, value) => {
        const newWorkflow = [...product.workflow];
        newWorkflow[index][field] = value;
        setProduct(p => ({ ...p, workflow: newWorkflow }));
    };
    const addWorkflowTask = () => {
        const newWorkflowTask = { temp_id: Date.now(), task_id: '', is_optional: false, prerequisites: [] };
        setProduct(p => ({ ...p, workflow: [...p.workflow, newWorkflowTask] }));
    };
    const removeWorkflowTask = (index) => setProduct(p => ({ ...p, workflow: p.workflow.filter((_, i) => i !== index) }));

    return (
        <div className="card card-edit">
            <div className="card-actions"><button onClick={() => onSave(product)} title="Guardar"><IconoGuardar /></button><button onClick={onCancel} title="Cancelar"><IconoDescartar /></button></div>
            <div className="card-content">
                <label>Nombre del Producto</label>
                <input type="text" value={product.name} onChange={(e) => handleFieldChange('name', e.target.value)} autoFocus />
                <hr style={{ margin: '20px 0' }} />
                <h4>Flujo de Tareas del Producto</h4>
                {product.workflow.map((wfTask, index) => {
                    const prerequisiteOptions = product.workflow
                        .filter(p => (p.temp_id || p.id) !== (wfTask.temp_id || wfTask.id) && p.task_id)
                        .map(p => ({
                            value: p.temp_id || p.id,
                            label: allTasks.find(t => t.id === p.task_id)?.name || 'Tarea sin nombre'
                        }));
                    
                    return (
                        <div key={wfTask.temp_id || wfTask.id} className="task-rule-form">
                             <button onClick={() => removeWorkflowTask(index)} className="delete-icon-small"><IconoEliminar /></button>
                            <div className="form-grid">
                                <div className="full-width"><label>Tarea</label><select value={wfTask.task_id} onChange={(e) => handleWorkflowChange(index, 'task_id', parseInt(e.target.value, 10))}><option value="">-- Seleccionar --</option>{allTasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                                <div className="full-width">
                                    <label>Prerrequisitos (deben terminar antes)</label>
                                    <ChipSelector
                                        options={prerequisiteOptions}
                                        selectedValues={wfTask.prerequisites}
                                        onChange={newPrerequisites => handleWorkflowChange(index, 'prerequisites', newPrerequisites)}
                                        placeholder="+ Añadir prerrequisito..."
                                    />
                                </div>
                                <div className="toggle-switch">
                                    <input type="checkbox" id={`optional-${index}`} checked={wfTask.is_optional} onChange={(e) => handleWorkflowChange(index, 'is_optional', e.target.checked)} />
                                    <label htmlFor={`optional-${index}`}></label>
                                    <span>¿Esta tarea es opcional?</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <button onClick={addWorkflowTask} className="add-button-small">+ Añadir Tarea al Flujo</button>
            </div>
        </div>
    );
}

// --- Componente Principal de la Página ---
export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingProductId, setEditingProductId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [productsRes, tasksRes] = await Promise.all([fetch('/api/products'), fetch('/api/tasks')]);
            if (!productsRes.ok || !tasksRes.ok) throw new Error("API fetch failed");
            const productsData = await productsRes.json();
            const tasksData = await tasksRes.json();
            setProducts(productsData);
            setTasks(tasksData);
        } catch (error) { console.error("Error al cargar datos:", error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (productData) => {
        const isCreating = !productData.id;
        try {
            const response = await fetch('/api/products', {
                method: isCreating ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            if (!response.ok) throw new Error((await response.json()).message);
            setIsCreating(false);
            setEditingProductId(null);
            fetchData();
        } catch (error) { alert(`Error al guardar: ${error.message}`); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este producto?")) return;
        try {
            await fetch('/api/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            fetchData();
        } catch (error) { alert(`Error al eliminar: ${error.message}`); }
    };
    
    const handleEdit = (product) => {
        setEditingProductId(product.id);
        setIsCreating(false);
    };
    
    const handleCancel = () => {
        setIsCreating(false);
        setEditingProductId(null);
    };

    const handleAddNew = () => {
        setIsCreating(true);
        setEditingProductId(null);
    };

    return (
        <div className="app-container">
            <header><h1>Configurar Productos</h1><button className="add-button" onClick={handleAddNew} disabled={isCreating || editingProductId !== null}>+ Nuevo Producto</button></header>
            {isLoading ? <p>Cargando...</p> : (
                isCreating || editingProductId !== null ? (
                    <ProductForm
                        initialData={
                            isCreating 
                            ? { id: null, name: '', workflow: [] } 
                            : products.find(p => p.id === editingProductId)
                        }
                        allTasks={tasks}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                ) : (
                    <main className="grid-container">
                        {products.map(product => (
                            <div key={product.id} className="card" onClick={() => handleEdit(product)}>
                                <button className="delete-icon" onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}><IconoEliminar /></button>
                                <div className="card-content">
                                    <span>{product.name}</span>
                                    <div className="task-summary">
                                        <strong>Flujo:</strong>
                                        {product.product_workflows.length > 0 ? (<ul>{product.product_workflows.map(wf => <li key={wf.id}>{wf.tasks.name}</li>)}</ul>) : <span>Sin tareas</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </main>
                )
            )}
        </div>
    );
}