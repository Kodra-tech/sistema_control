# Guía de Uso — Salón Control

Bienvenida al sistema de control financiero de tu salón. Esta guía te explica cómo usar cada función, paso a paso, sin necesidad de conocimientos técnicos.

---

## Cómo iniciar sesión

1. Abre el navegador y ve a la dirección de tu sistema (ej. `https://salon-control.vercel.app`)
2. Escribe tu **correo electrónico** y **contraseña**
3. Haz clic en **Iniciar sesión**
4. Si olvidaste tu contraseña, contacta al administrador para que te envíe una invitación nueva

---

## Dashboard (Inicio)

Al entrar verás el resumen del mes actual:

- **Ventas del mes** — total de ingresos
- **Utilidad neta** — ventas menos gastos
- **Margen bruto** — porcentaje de ganancia sobre ventas
- **Citas hoy** — cuántas citas tienes agendadas hoy
- **Gráfica de 12 meses** — comparativo de ventas vs gastos
- **Top 5 servicios** — los servicios más vendidos del mes
- **Gastos por categoría** — gráfica de dona

Puedes cambiar el mes con el selector de fecha en la esquina superior derecha.

---

## Clientes

### Registrar un cliente nuevo
1. Ve a **Clientes** en el menú lateral
2. Haz clic en **Nuevo cliente**
3. Llena el formulario (nombre requerido, teléfono y email opcionales)
4. Haz clic en **Guardar**

### Buscar un cliente
Usa la barra de búsqueda en la parte superior de la tabla para buscar por nombre o teléfono.

### Editar o dar de baja un cliente
Haz clic en los **tres puntos (⋮)** al final de la fila del cliente y selecciona **Editar** o **Dar de baja**.

---

## Agenda (Citas)

### Agendar una cita nueva
1. Ve a **Agenda** en el menú lateral
2. Haz clic en **Nueva cita**
3. Busca el cliente (escribe su nombre)
4. Selecciona el servicio
5. Elige la fecha y hora
6. Haz clic en **Guardar**

El sistema te avisará si hay un conflicto de horario (otra cita en ±30 min).

### Cambiar el estado de una cita
Haz clic derecho sobre la cita en el calendario, o usa el menú de acciones:
- **Confirmada** — el cliente confirmó asistencia
- **Realizada** — la cita se llevó a cabo
- **Cancelada** — el cliente canceló
- **No asistió** — el cliente no se presentó

### Convertir una cita en venta
Cuando una cita está en estado **Realizada**:
1. Haz clic en **Convertir en venta**
2. Selecciona el método de pago
3. Aplica descuento si es necesario
4. Haz clic en **Confirmar**

La venta se registra automáticamente con los datos del servicio.

---

## Ventas

### Registrar una venta directa (sin cita)
1. Ve a **Ventas** en el menú lateral
2. Haz clic en **Nueva venta**
3. Elige si es un **Servicio** o **Producto**
4. Llena los datos (concepto, precio, cantidad, método de pago)
5. Haz clic en **Guardar**

### Exportar ventas a Excel
En la página de ventas, haz clic en **Exportar CSV**. El archivo se descarga y puede abrirse directamente en Excel.

---

## Gastos

### Registrar un gasto
1. Ve a **Gastos** en el menú lateral
2. Haz clic en **Nuevo gasto**
3. Llena el concepto, monto y categoría (Nómina, Renta, etc.)
4. Haz clic en **Guardar**

La gráfica de dona se actualiza automáticamente para mostrar el desglose por categoría.

---

## Reportes *(solo dueño)*

Ve a **Reportes** para ver:
- **Semanal** — ventas de los últimos 7 días por día
- **Por tipo** — servicios vs productos
- **Por método de pago** — efectivo, tarjeta, transferencia
- **Anual** — resumen mes a mes del año actual

Puedes exportar cualquier reporte a CSV con el botón **Exportar**.

---

## Documentos (PDFs)

1. Ve a **Documentos** en el menú (accede desde la barra de dirección si no aparece en el menú: `/documentos`)
2. Elige el tipo: **Cotización** o **Nota de venta**
3. Selecciona el cliente y los servicios
4. Haz clic en **Generar PDF**
5. El PDF se abre en una nueva pestaña para imprimir o descargar

---

## Inventario *(solo dueño)*

- **Agregar producto** — nombre, unidad, stock inicial, precio de compra y venta
- **Alerta de stock bajo** — los productos con stock igual o menor al mínimo aparecen en rojo
- En el Dashboard, la alerta de stock bajo aparece como un aviso amarillo con los productos afectados

---

## Compras *(solo dueño)*

Registra cuando compras mercancía al proveedor:
1. Ve a **Compras**
2. Haz clic en **Nueva compra**
3. Selecciona el producto del inventario
4. Ingresa la cantidad y precio unitario
5. Haz clic en **Guardar**

El stock del producto se actualiza automáticamente.

---

## Configuración *(solo dueño)*

### Datos del salón
En **Configuración**, actualiza el nombre del salón, dirección, teléfono y logo (estos datos aparecen en los PDFs).

### Gestión de usuarios

#### Invitar a un empleado
1. Ve a **Configuración → Usuarios**
2. Haz clic en **Invitar usuario**
3. Ingresa el nombre, correo y rol (**empleado**)
4. Haz clic en **Enviar invitación**
5. El empleado recibirá un correo para crear su contraseña

#### Cambiar rol de un usuario
En la tabla de usuarios, haz clic en el selector de rol de la fila correspondiente.

#### Dar de baja a un usuario
Usa el switch **Activo/Inactivo** en la fila del usuario. Un usuario inactivo no puede iniciar sesión.

---

## Preguntas frecuentes

**¿Puedo usar el sistema desde mi celular?**
Sí. El sistema es responsivo y funciona en dispositivos móviles. En pantallas pequeñas, el menú lateral se abre con el botón ☰ en la esquina superior izquierda.

**¿Se guardan mis datos automáticamente?**
Sí. Todos los datos se guardan en la nube (Supabase) en tiempo real. No necesitas hacer nada especial.

**¿Qué pasa si cierro el navegador sin guardar?**
Los formularios no guardados se pierden. Siempre haz clic en **Guardar** antes de cerrar.

**¿Puedo recuperar un registro eliminado?**
No. Los registros eliminados no se pueden recuperar desde la interfaz. Contacta al administrador técnico si necesitas recuperar datos.

**¿Cómo actualizo los precios de los servicios?**
Ve a **Servicios** → clic en ⋮ de la fila → **Editar** → cambia el precio → **Guardar**.

**¿El sistema funciona sin internet?**
No. Requiere conexión a internet para funcionar, ya que los datos están en la nube.
