import React, { useState, useEffect } from 'react';

export default function CreateOrderModal({ products, onClose, onSave }) {
    const [order, setOrder] = useState({ 
        productId: '', quantity: 1000, orderNumber: '', dueDate: '', 
        width: 0, height: 0, 
        configs: { optional_tasks: [], block_sizes: {}, passes: {} } 
    });
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const product = products.find(p => p.id === parseInt(order.productId, 10));
        setSelectedProduct(product || null);
    }, [order.productId, products]);

    const handleChange = (field, value) => setOrder(p => ({ ...p, [field]: value }));
    const handleConfigChange = (type, key, value) => setOrder(p => ({ ...p, configs: { ...p.configs, [type]: { ...p.configs[type], [key]: value } } }));
    const handleOptionalToggle = (id) => {
        const newSelection = order.configs.optional_tasks.includes(id) ? order.configs.optional_tasks.filter(item => item !== id) : [...order.configs.optional_tasks, id];
        setOrder(p => ({...p, configs: {...p.configs, optional_tasks: newSelection}}));
    };
    
    const getTasksForParams = () => {
        if (!selectedProduct) return [];
        return selectedProduct.product_workflows.filter(wf => !wf.is_optional || order.configs.optional_tasks.includes(wf.id));
    };

    return (
        <div className="modal-backdrop">
            <div className="modal card-edit">
                <h2>Crear Nuevo Pedido</h2>
                <div className="form-section">
                    <label>Producto</label><select value={order.productId} onChange={e => handleChange('productId', e.target.value)}><option value="">-- Seleccionar --</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <div className="form-grid">
                        <div><label>Cantidad</label><input type="number" value={order.quantity} onChange={e => handleChange('quantity', e.target.value)} /></div>
                        <div><label>N° Pedido</label><input type="text" value={order.orderNumber} onChange={e => handleChange('orderNumber', e.target.value)} /></div>
                        <div><label>Ancho (mm)</label><input type="number" value={order.width} onChange={e => handleChange('width', e.target.value)} /></div>
                        <div><label>Alto (mm)</label><input type="number" value={order.height} onChange={e => handleChange('height', e.target.value)} /></div>
                    </div>
                </div>

                {selectedProduct && selectedProduct.product_workflows.some(wf => wf.is_optional) && (
                    <div className="form-section">
                        <label>Tareas Opcionales</label>
                        {selectedProduct.product_workflows.filter(wf => wf.is_optional).map(wf => (
                            <div key={wf.id} className="toggle-switch"><input type="checkbox" id={`opt-${wf.id}`} checked={order.configs.optional_tasks.includes(wf.id)} onChange={() => handleOptionalToggle(wf.id)} /><label htmlFor={`opt-${wf.id}`}></label><span>{wf.tasks.name}</span></div>
                        ))}
                    </div>
                )}
                
                <div className="form-section">
                    <label>Parámetros de Tareas</label>
                    {getTasksForParams().map(wf => (
                        <div key={wf.id} className="form-grid">
                            <strong>{wf.tasks.name}</strong>
                            {/* Aquí se pueden añadir inputs para `passes` y `block_sizes` */}
                        </div>
                    ))}
                </div>

                <div className="modal-actions">
                    <button onClick={onClose}>Cancelar</button>
                    <button className="add-button" onClick={() => onSave(order)}>Crear Pedido</button>
                </div>
            </div>
        </div>
    );
}