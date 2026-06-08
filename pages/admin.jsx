import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { getSupabaseClient } from '../lib/supabase/client';

const emptyProductForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  imagen_url: '',
  categoria: '525hp'
};

const orderStatuses = ['pendiente', 'pagada', 'confirmada', 'enviada', 'entregada', 'cancelada'];

const formatPrice = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(value))
    : 'Sin fecha';

function normalizeProductPayload(formState) {
  return {
    nombre: formState.nombre.trim(),
    descripcion: formState.descripcion.trim(),
    precio: Number(formState.precio),
    stock: Number.parseInt(formState.stock || '0', 10),
    imagen_url: formState.imagen_url.trim(),
    categoria: formState.categoria.trim() || '525hp'
  };
}

export default function AdminPage() {
  const [supabase, setSupabase] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [activeTab, setActiveTab] = useState('productos');
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const isAdmin = profile?.rol === 'admin';

  const adminStats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.estado === 'pagada' || order.estado === 'entregada');
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      products: products.length,
      orders: orders.length,
      users: users.length,
      revenue
    };
  }, [orders, products.length, users.length]);

  const loadAdminData = async (client, user) => {
    setLoading(true);
    setMessage('');

    if (!client || !user) {
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await client
      .from('usuarios')
      .select('id, email, nombre, apellido, rol')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || profileData?.rol !== 'admin') {
      setProfile(profileData || null);
      setProducts([]);
      setOrders([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const [productsResult, ordersResult, usersResult] = await Promise.all([
      client
        .from('productos')
        .select('id, nombre, descripcion, precio, stock, imagen_url, categoria, actualizado_en, creado_en')
        .order('id', { ascending: true }),
      client
        .from('ordenes')
        .select(`
          id,
          total,
          estado,
          metodo_pago,
          referencia_pago,
          mercadopago_status,
          mercadopago_payment_id,
          pagado_en,
          usuario_id,
          creado_en,
          detalles_orden (
            cantidad,
            precio_unitario,
            productos (
              nombre
            )
          )
        `)
        .order('creado_en', { ascending: false }),
      client
        .from('usuarios')
        .select('id, email, nombre, apellido, telefono, direccion, rol, creado_en')
        .order('creado_en', { ascending: false })
    ]);

    if (productsResult.error || ordersResult.error || usersResult.error) {
      console.error('Admin data load error:', {
        products: productsResult.error,
        orders: ordersResult.error,
        users: usersResult.error
      });
      setMessage('No pudimos cargar todos los datos del panel. Revisá RLS y tu rol admin.');
      window.setTimeout(() => setMessage(''), 3200);
    }

    const usersById = new Map((usersResult.data || []).map((adminUser) => [adminUser.id, adminUser]));
    const ordersWithUsers = (ordersResult.data || []).map((order) => ({
      ...order,
      usuarios: usersById.get(order.usuario_id) || null
    }));

    setProducts(productsResult.data || []);
    setOrders(ordersWithUsers);
    setUsers(usersResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const client = getSupabaseClient();
    setSupabase(client);

    if (!client) {
      setMessage('Supabase no está configurado.');
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    client.auth.getUser().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      const user = data.user || null;
      setSessionUser(user);
      loadAdminData(client, user);
    });

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setSessionUser(user);
      loadAdminData(client, user);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const showMessage = (nextMessage) => {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(''), 3200);
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      precio: String(product.precio || ''),
      stock: String(product.stock || 0),
      imagen_url: product.imagen_url || '',
      categoria: product.categoria || '525hp'
    });
    setActiveTab('productos');
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();

    if (!supabase || !isAdmin) {
      showMessage('Necesitás permisos de administrador.');
      return;
    }

    const payload = normalizeProductPayload(productForm);

    if (payload.nombre.length < 3) {
      showMessage('El producto necesita un nombre válido.');
      return;
    }

    if (!Number.isFinite(payload.precio) || payload.precio <= 0) {
      showMessage('Ingresá un precio válido mayor a cero.');
      return;
    }

    if (!Number.isInteger(payload.stock) || payload.stock < 0) {
      showMessage('El stock no puede ser negativo.');
      return;
    }

    setSaving(true);

    const query = editingProductId
      ? supabase.from('productos').update(payload).eq('id', editingProductId)
      : supabase.from('productos').insert(payload);

    const { error } = await query;

    setSaving(false);

    if (error) {
      showMessage(error.message || 'No pudimos guardar el producto.');
      return;
    }

    resetProductForm();
    await loadAdminData(supabase, sessionUser);
    showMessage(editingProductId ? 'Producto actualizado.' : 'Producto creado.');
  };

  const handleDeleteProduct = async (product) => {
    if (!supabase || !isAdmin) {
      showMessage('Necesitás permisos de administrador.');
      return;
    }

    const confirmed = window.confirm(`¿Eliminar "${product.nombre}" del catálogo?`);

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', product.id);

    if (error) {
      showMessage('No se pudo eliminar. Puede estar asociado a una orden existente.');
      return;
    }

    await loadAdminData(supabase, sessionUser);
    showMessage('Producto eliminado.');
  };

  const handleOrderStatusChange = async (orderId, nextStatus) => {
    if (!supabase || !isAdmin) {
      showMessage('Necesitás permisos de administrador.');
      return;
    }

    const payload = {
      estado: nextStatus,
      pagado_en: nextStatus === 'pagada' ? new Date().toISOString() : null
    };

    const { error } = await supabase
      .from('ordenes')
      .update(payload)
      .eq('id', orderId);

    if (error) {
      showMessage(error.message || 'No pudimos actualizar la orden.');
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === orderId ? { ...order, ...payload } : order))
    );
    showMessage('Estado de orden actualizado.');
  };

  const handleSyncPaidOrders = async () => {
    if (!supabase || !isAdmin) {
      showMessage('Necesitás permisos de administrador.');
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      showMessage('No encontramos una sesión activa.');
      return;
    }

    const response = await fetch('/api/payments/sync-paid-orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showMessage(data.error || 'No pudimos sincronizar pagos.');
      return;
    }

    await loadAdminData(supabase, sessionUser);
    showMessage(`Pagos sincronizados: ${data.updatedPayments || 0}.`);
  };

  const handleUserRoleChange = async (userId, nextRole) => {
    if (!supabase || !isAdmin) {
      showMessage('Necesitás permisos de administrador.');
      return;
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ rol: nextRole })
      .eq('id', userId);

    if (error) {
      showMessage(error.message || 'No pudimos actualizar el usuario.');
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === userId ? { ...user, rol: nextRole } : user))
    );
    showMessage('Rol actualizado.');
  };

  return (
    <>
      <Head>
        <title>Admin | 525hp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="admin-page">
        <Header actionHref="/catalogo" actionLabel="Ver colección" />

        <main className="admin-main">
          <section className="admin-hero">
            <div className="hero-lines checkout-page-lines" aria-hidden="true">
              <span className="hero-line hero-line-blue"></span>
              <span className="hero-line hero-line-gold"></span>
              <span className="hero-line hero-line-red"></span>
            </div>

            <div className="container admin-shell">
              <div className="admin-heading">
                <p className="eyebrow">Panel privado</p>
                <h1>Administración 525hp</h1>
                <p>
                  Gestioná catálogo, órdenes y usuarios desde una interfaz conectada a Supabase con control por roles.
                </p>
              </div>

              {isLoading ? (
                <section className="admin-card">
                  <p className="account-muted">Cargando panel administrativo...</p>
                </section>
              ) : !sessionUser ? (
                <section className="admin-card admin-access-card">
                  <p className="eyebrow">Acceso requerido</p>
                  <h2>Iniciá sesión para entrar al panel.</h2>
                  <Link href="/login?next=/admin" className="checkout-primary-btn">Ingresar</Link>
                </section>
              ) : !isAdmin ? (
                <section className="admin-card admin-access-card">
                  <p className="eyebrow">Sin permisos</p>
                  <h2>Tu cuenta no tiene rol administrador.</h2>
                  <p className="admin-muted">Pedí que tu usuario sea marcado como admin en Supabase antes de continuar.</p>
                  <Link href="/" className="checkout-secondary-btn">Volver al inicio</Link>
                </section>
              ) : (
                <>
                  <section className="admin-stats" aria-label="Resumen administrativo">
                    <article className="admin-stat-card">
                      <span>Productos</span>
                      <strong>{adminStats.products}</strong>
                    </article>
                    <article className="admin-stat-card">
                      <span>Órdenes</span>
                      <strong>{adminStats.orders}</strong>
                    </article>
                    <article className="admin-stat-card">
                      <span>Usuarios</span>
                      <strong>{adminStats.users}</strong>
                    </article>
                    <article className="admin-stat-card">
                      <span>Ventas pagadas</span>
                      <strong>{formatPrice(adminStats.revenue)}</strong>
                    </article>
                  </section>

                  <section className="admin-card">
                    <div className="admin-tabs" role="tablist" aria-label="Secciones del panel">
                      {['productos', 'ordenes', 'usuarios'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          className={`admin-tab ${activeTab === tab ? 'is-active' : ''}`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {activeTab === 'productos' && (
                      <div className="admin-grid-layout">
                        <form className="admin-product-form" onSubmit={handleSaveProduct}>
                          <div className="admin-section-title">
                            <p>{editingProductId ? 'Edición' : 'Nuevo producto'}</p>
                            <h2>{editingProductId ? 'Actualizar pieza' : 'Crear pieza'}</h2>
                          </div>

                          <label className="checkout-field">
                            <span>Nombre</span>
                            <input
                              name="nombre"
                              value={productForm.nombre}
                              onChange={handleProductChange}
                              maxLength={255}
                              required
                            />
                          </label>

                          <label className="checkout-field">
                            <span>Descripción</span>
                            <textarea
                              name="descripcion"
                              value={productForm.descripcion}
                              onChange={handleProductChange}
                              rows="4"
                              maxLength={500}
                            />
                          </label>

                          <div className="admin-form-row">
                            <label className="checkout-field">
                              <span>Precio</span>
                              <input
                                name="precio"
                                type="number"
                                min="1"
                                step="0.01"
                                value={productForm.precio}
                                onChange={handleProductChange}
                                required
                              />
                            </label>
                            <label className="checkout-field">
                              <span>Stock</span>
                              <input
                                name="stock"
                                type="number"
                                min="0"
                                step="1"
                                value={productForm.stock}
                                onChange={handleProductChange}
                                required
                              />
                            </label>
                          </div>

                          <label className="checkout-field">
                            <span>Imagen URL</span>
                            <input
                              name="imagen_url"
                              value={productForm.imagen_url}
                              onChange={handleProductChange}
                              placeholder="/assets/productos/mesa-bmw.png"
                              maxLength={500}
                            />
                          </label>

                          <label className="checkout-field">
                            <span>Categoría</span>
                            <input
                              name="categoria"
                              value={productForm.categoria}
                              onChange={handleProductChange}
                              maxLength={100}
                            />
                          </label>

                          <div className="admin-form-actions">
                            <button type="submit" className="checkout-primary-btn" disabled={isSaving}>
                              {isSaving ? 'Guardando...' : editingProductId ? 'Guardar cambios' : 'Crear producto'}
                            </button>
                            <button type="button" className="checkout-secondary-btn" onClick={resetProductForm}>
                              Limpiar
                            </button>
                          </div>
                        </form>

                        <div className="admin-table-panel">
                          <div className="admin-section-title">
                            <p>Catálogo</p>
                            <h2>Productos activos</h2>
                          </div>

                          <div className="admin-table-scroll">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th>Precio</th>
                                  <th>Stock</th>
                                  <th>Categoría</th>
                                  <th>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {products.map((product) => (
                                  <tr key={product.id}>
                                    <td>
                                      <div className="admin-product-cell">
                                        <img src={product.imagen_url || '/assets/productos/mesa-bmw.png'} alt={product.nombre} />
                                        <div>
                                          <strong>{product.nombre}</strong>
                                          <span>{product.descripcion || 'Sin descripción'}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td>{formatPrice(product.precio)}</td>
                                    <td>{product.stock}</td>
                                    <td>{product.categoria || 'Sin categoría'}</td>
                                    <td>
                                      <div className="admin-row-actions">
                                        <button type="button" onClick={() => handleEditProduct(product)}>Editar</button>
                                        <button type="button" onClick={() => handleDeleteProduct(product)}>Eliminar</button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'ordenes' && (
                      <div className="admin-table-panel">
                        <div className="admin-section-header">
                          <div className="admin-section-title">
                            <p>Operación</p>
                            <h2>Órdenes y pagos</h2>
                          </div>
                          <button type="button" className="checkout-secondary-btn admin-sync-btn" onClick={handleSyncPaidOrders}>
                            Sincronizar pagos
                          </button>
                        </div>

                        <div className="admin-table-scroll">
                          <table className="admin-table admin-orders-table">
                            <thead>
                              <tr>
                                <th>Orden</th>
                                <th>Cliente</th>
                                <th>Productos</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Pago</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map((order) => (
                                <tr key={order.id}>
                                  <td>
                                    <strong>#{order.referencia_pago || order.id}</strong>
                                    <span>{formatDate(order.creado_en)}</span>
                                  </td>
                                  <td>
                                    <strong>
                                      {[order.usuarios?.nombre, order.usuarios?.apellido].filter(Boolean).join(' ') || 'Cliente'}
                                    </strong>
                                    <span>{order.usuarios?.email || 'Sin email'}</span>
                                  </td>
                                  <td>
                                    <ul className="admin-order-products">
                                      {order.detalles_orden?.map((detail, index) => (
                                        <li key={`${order.id}-${index}`}>
                                          {detail.cantidad} x {detail.productos?.nombre || 'Producto'}
                                        </li>
                                      ))}
                                    </ul>
                                  </td>
                                  <td>{formatPrice(order.total)}</td>
                                  <td>
                                    <select
                                      className="admin-status-select"
                                      value={order.estado}
                                      onChange={(event) => handleOrderStatusChange(order.id, event.target.value)}
                                    >
                                      {orderStatuses.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <strong>{order.mercadopago_status || order.metodo_pago || 'Sin pago'}</strong>
                                    <span>{order.mercadopago_payment_id || 'Sin ID de pago'}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeTab === 'usuarios' && (
                      <div className="admin-table-panel">
                        <div className="admin-section-title">
                          <p>Roles</p>
                          <h2>Usuarios registrados</h2>
                        </div>

                        <div className="admin-table-scroll">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Usuario</th>
                                <th>Contacto</th>
                                <th>Dirección</th>
                                <th>Rol</th>
                                <th>Alta</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((user) => (
                                <tr key={user.id}>
                                  <td>
                                    <strong>{[user.nombre, user.apellido].filter(Boolean).join(' ') || 'Sin nombre'}</strong>
                                    <span>{user.email || 'Sin email'}</span>
                                  </td>
                                  <td>{user.telefono || 'Sin teléfono'}</td>
                                  <td>{user.direccion || 'Sin dirección'}</td>
                                  <td>
                                    <select
                                      className="admin-status-select"
                                      value={user.rol}
                                      onChange={(event) => handleUserRoleChange(user.id, event.target.value)}
                                      disabled={user.id === sessionUser?.id}
                                      title={user.id === sessionUser?.id ? 'No podés quitarte tu propio rol admin desde el panel.' : undefined}
                                    >
                                      <option value="cliente">cliente</option>
                                      <option value="admin">admin</option>
                                    </select>
                                  </td>
                                  <td>{formatDate(user.creado_en)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </section>
        </main>

        {message && (
          <div className="cart-toast is-visible" role="status" aria-live="polite" aria-atomic="true">
            {message}
          </div>
        )}
      </div>
    </>
  );
}
