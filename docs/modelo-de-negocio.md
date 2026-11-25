# Modelo de negocio de la Plataforma Axs

**Estado:** aprobado por Fabricio (2026-11-25)
**Reemplaza:** la parte de negocio de `docs/PRD-DEFINITIVO-sabrina.md` (secciones 0, 1 y 3 en lo
que hace a quién edita qué, mantenimientos y pagos). El PRD sigue valiendo para el diseño del
sitio de Sabrina, el stack y las convenciones.

Este documento define **qué se vende, a quién, cómo se cobra y en qué orden se construye**. No
define cómo se programa: cada proyecto de la sección 9 tiene después su propio expediente en
`docs/auditoria/cambios/`.

Cada punto indica su origen:

- **[Decidido]**: lo decidió Fabricio en la conversación de diseño.
- **[Propuesta]**: lo propuso el asistente y Fabricio no lo objetó. Revisar al leer.
- **[Abierto]**: falta decidir; se resuelve en el proyecto que se indica.

---

## 1. Qué es y por qué cambia

Axs vende sitios web por suscripción a personas y negocios chicos. Hasta ahora el modelo era:
sitio a medida hecho por Axs, la clienta solo edita textos y fotos, y paga un mantenimiento
mensual que incluye un cambio estructural.

El modelo nuevo le da a la clienta más poder sobre su sitio. La idea salió de mirar el panel de
GenericShop (relevamiento del 2026-11-23): que la persona pueda hacer cosas sola es un valor
agregado para ella y le ahorra tiempo a Axs. [Decidido]

**Principio nuevo:** la clienta **elige entre opciones ya diseñadas**; nunca diseña desde cero.
Toda combinación que el panel permita tiene que verse bien. [Decidido]

No hay clientas que paguen todavía. El sitio de Sabrina no es una venta: es el caso de muestra
del plan a medida y el campo de pruebas del sistema. [Decidido]

## 2. Los dos planes

No hay niveles (básico, pro). Son dos planes más extras que se pagan aparte. [Decidido]

### 2.1 Plan genérico

- El sitio se arma a partir del **molde de su rubro** (sección 4). [Decidido]
- Incluye una cantidad limitada de secciones, entre 4 y 6. [Decidido]
- El límite se cuenta en **lugares en la página**, no en tipos de sección: la clienta llena sus
  lugares con las secciones que quiera del catálogo de su rubro y las puede cambiar cuando
  quiera. [Propuesta]
- La cabecera y el pie no ocupan lugar; todo lo demás sí, incluida la portada. [Propuesta]
- La cantidad exacta de lugares de cada rubro se define al armar su molde. [Abierto, proyecto 3]
- Tiene todas las herramientas de edición de la sección 3. [Decidido]

### 2.2 Plan a medida

- Axs diseña el sitio para esa clienta, con secciones y detalles propios. [Decidido]
- Puede tener muchas más secciones que el genérico. [Decidido]
- La cantidad de secciones se acuerda al contratar. Sumar más después se paga con los mismos
  extras que en el genérico. [Propuesta]
- Tiene **las mismas herramientas de edición que el genérico**. Si el plan caro tuviera menos
  poder que el barato, nadie lo elegiría: lo que suma es el diseño a medida, no la edición.
  [Decidido]
- "Las mismas herramientas" significa el mismo poder, con **opciones diseñadas para ese sitio**,
  no paridad total con el catálogo genérico. [Decidido]
  - La clienta puede reordenar, mostrar y ocultar secciones, elegir destacados, poner
    promociones y bandera, y elegir el estilo de animación, igual que en el genérico.
  - Las paletas son dos o tres pensadas para su diseño, no las del genérico.
  - Cada sección exclusiva tiene las variantes que Axs le haya diseñado, que puede ser una sola.
  - Además puede sumar secciones del catálogo de su rubro, que ya vienen con sus variantes y se
    adaptan a las paletas de su sitio.
  - Se descartó la paridad total (cada sección exclusiva con varias variantes y compatible con
    todas las paletas genéricas): multiplica el trabajo de diseño por cada sección a medida y
    una paleta genérica puede arruinar un diseño hecho a medida.
- Para lograrlo, los sitios a medida se construyen sobre la misma biblioteca de secciones que
  los genéricos, sumando secciones exclusivas y diseño propio. [Propuesta]
- El sitio de Sabrina se rehace sobre la biblioteca **manteniendo su diseño actual**. Es el
  ejemplo del plan a medida. [Decidido]

### 2.3 Extras (se pagan aparte)

| Extra | Qué es | Se paga | Origen |
|---|---|---|---|
| Sección adicional | Un lugar más en la página, para una sección que ya existe en el catálogo. Habilitarlo no requiere trabajo de diseño. | Una vez | [Decidido] (la idea), [Propuesta] (que sea un lugar y pago único) |
| Sección nueva a medida | Una sección que no existe en el catálogo. Es trabajo de diseño y se cobra distinto. | Una vez | [Propuesta] |
| Carga del contenido | Axs carga textos, fotos y logo por la clienta. | Una vez | [Propuesta] |
| Configuración del dominio | Axs conecta el dominio propio de la clienta. | Una vez | [Propuesta] |
| Módulos | Ver sección 8. No se construyen por ahora. | Por mes | [Propuesta] |

Los montos no están definidos. La cifra de "25 mil por sección" fue un ejemplo. [Abierto, se
define antes de publicar]

Si un precio cambia, falta decidir si las clientas que ya están suscriptas pasan al precio nuevo
o conservan el anterior. [Abierto, proyecto 4]

## 3. Qué puede hacer la clienta en su panel

[Decidido], salvo donde se indica:

- Editar textos, títulos y fotos.
- Agregar y quitar servicios, fotos y otros elementos de las listas.
- Editar sus **redes sociales** y datos de contacto (enlaces, WhatsApp, ubicación). Hoy el
  panel de Sabrina ya lo permite.
- Elegir **destacados**.
- Poner **promociones** y una **bandera de descuento**. [Propuesta] sobre qué son:
  - bandera de descuento: una franja de anuncio arriba del sitio, con un texto corto y fecha de
    vencimiento opcional. Disponible en todos los rubros.
  - promociones: un precio promocional en los elementos que tienen precio (servicios, productos)
    y una sección de promociones en los rubros que la tengan en su catálogo.
  - Ninguna de las dos va como etiqueta encima de las fotos: lo prohíben las reglas de
    `docs/anti-ia-principios.md`.
- Cambiar la **variante** de una sección entre las disponibles (por ejemplo, la portada como
  slides, banner o cuadrícula).
- Cambiar el **orden** de las secciones.
- Elegir una **paleta** entre las predefinidas.
- Elegir **animaciones**. [Propuesta]: se elige un estilo general para todo el sitio entre dos o
  tres ("sin animación", "suave", "expresiva"), no una animación por sección, para que toda
  combinación se vea bien y se respeten las reglas de motion de `docs/anti-ia-principios.md`.
- Ver una **vista previa** antes de publicar. [Decidido]
- Trabajar en **borrador**, **publicar** cuando quiera y **volver a la versión anterior**.
  [Propuesta]

**Sobre los colores:** la regla del proyecto es un solo acento de color para toda la página
(`docs/anti-ia-principios.md`). Por eso cada paleta define un acento y sus neutros, y se aplica
al sitio entero. Las secciones pueden alternar fondos dentro de la paleta, pero no tienen color
libre por sección. [Propuesta]

Lo que la clienta no puede hacer: colores o tipografías libres, mover elementos dentro de una
sección, ni crear secciones que no estén en su catálogo.

## 4. Rubros y moldes

- Cada rubro tiene su propio molde, con secciones pensadas para ese rubro. [Decidido]
- Se arranca con pocos rubros y se van sumando: **marca personal** (influencers, creadoras de
  contenido) y **restaurantes**; quizás **barberías** y **perfumes**. [Decidido]
- Los moldes comparten un núcleo (sobre mí o nosotros, galería, testimonios, preguntas
  frecuentes, contacto, redes) y cada rubro suma las suyas. [Propuesta]. Ejemplos:
  - marca personal: propuestas o packs, marcas con las que trabajó;
  - restaurante: carta, horarios, reservas;
  - barbería: servicios con precio, turnos;
  - perfumes: catálogo, destacados, promociones.
- Cuáles de los cuatro rubros entran en el lanzamiento: marca personal seguro; el resto se decide
  al terminar el primer molde. [Abierto]

### La acción de una sección

Los rubros que venden (perfumes, ropa) tienen que poder integrarse a futuro con una tienda
virtual; la tienda no se construye ahora, pero la abstracción tiene que existir. [Decidido]

Lo mismo vale para turnos y reservas. Se usa una sola abstracción: una sección muestra algo y
tiene una **acción**. Hoy la acción abre WhatsApp o un enlace externo. Más adelante puede abrir
un módulo propio (tienda, turnos) sin rehacer la sección. [Propuesta]

## 5. Cobro

- **Suscripción para todas las clientas.** [Decidido]
- La suscripción incluye el mantenimiento: que el sitio funcione, atender vulnerabilidades y
  reportes automáticos. [Decidido]
- Pago mensual, con opción anual con descuento. [Propuesta]
- **Cupones de descuento.** [Decidido]
- Medios de pago: tarjeta, transferencia y otros. [Decidido]
  - El cobro automático mensual solo es posible con tarjeta o cuenta de Mercado Pago. Con
    transferencia, cada pago se confirma a mano. [Propuesta, a confirmar con la documentación de
    Mercado Pago en el proyecto 4]

**Cuándo se cobra:**

- Genérico: no tiene pago inicial. Al contratar, después de ver la vista previa, paga completo
  el primer período (el mes o el año). El período corre desde el pago, no desde que publica.
  [Propuesta]
- A medida: un pago inicial por el diseño, con anticipo al arrancar (por ejemplo 50%) y el resto
  a la entrega. La suscripción empieza cuando el sitio se publica. [Propuesta]

**Si deja de pagar o se da de baja:** [Decidido]. Los días son ejemplos. [Abierto]

1. Falla el cobro: aviso por correo y días de gracia (por ejemplo 7) con el sitio funcionando.
2. Pasa la gracia: el sitio se pausa. Los visitantes ven una página neutra de "sitio no
   disponible"; la clienta sigue entrando al panel para pagar.
3. Sigue sin pagar: el contenido se guarda un tiempo (por ejemplo 60 días) y después se borra,
   con aviso previo.
4. Baja voluntaria: igual que el punto 3, y además puede descargar sus textos y fotos.

**Reportes automáticos:** a quién van y qué dicen (visitas, disponibilidad, qué se actualizó)
está por definir. [Abierto, proyecto 4]

**Facturación y obligaciones legales:** [Propuesta, a confirmar con un contador antes de
publicar]

- Al lanzar, las facturas se emiten a mano, fuera del sistema. Automatizarlas queda para después.
- La contratación online de una suscripción tiene obligaciones hacia el consumidor (poder darse
  de baja online y arrepentirse de la compra dentro de un plazo). El alta y el panel las tienen
  que contemplar: se relevan en el proyecto 4.

## 6. Cómo llega una clienta

### 6.1 El sitio de Axs

Axs tiene su propio sitio, que presenta los servicios, muestra los planes con sus precios, usa
técnicas de marketing (embudo) y permite contratar ahí mismo. [Decidido]

Se construye con la misma biblioteca de secciones: es vidriera y prueba del sistema. [Propuesta]

### 6.2 Alta del plan genérico

Hay dos caminos y los dos existen. [Decidido]

**La clienta sola:**

1. Completa un formulario de varios pasos que pide **lo mínimo**: cómo se llama, cómo se llama
   la marca, a qué se dedica, qué colores le gustan. No pide logo ni fotos (es fricción); se le
   explica que los carga después. [Decidido]
2. Se le genera el sitio y lo ve en una vista previa, con **siluetas** en lugar de fotos y logo.
   [Decidido]
   - "Generar" es tomar el molde de su rubro, con textos de ejemplo ya escritos, y ponerle su
     nombre, su marca y la paleta más cercana a los colores que eligió. No se redactan textos
     con IA en el lanzamiento. [Propuesta]
3. Paga ahí mismo. [Decidido]
4. Recibe por correo los accesos y el manual. [Decidido]
5. Termina de configurar su sitio con un recorrido de "primeros pasos". [Decidido]

**Con Axs:** la persona contacta directo, Axs la da de alta con sus datos, fotos y logo, y le
envía un link de pago. [Decidido]

Los dos caminos usan el mismo mecanismo: Axs completa el mismo formulario en nombre de la
clienta, y el link de pago es la misma pantalla de vista previa con el botón de pagar. Los
cupones funcionan igual en los dos. [Propuesta]

**Pagar y publicar son momentos distintos:** al pagar recibe los accesos; el sitio sale al
público cuando ella lo publica. Las secciones que sigan con contenido de ejemplo se ocultan o se
le marcan para revisar. [Propuesta]

**Vistas previas sin pagar:** vencen a los pocos días y el formulario tiene un control
anti-bots, para que nadie llene el servidor de sitios. [Propuesta]

### 6.3 Alta del plan a medida

La persona completa un formulario breve, que sirve para que Axs tenga contexto antes de
contactarla. No hay vista previa ni pago automático: se conversa, se acuerda y se cobra el
anticipo. [Decidido]

## 7. Dominio

- Todo sitio nace en un subdominio de Axs, incluido en el plan. [Propuesta, necesaria para que
  la vista previa y el alta sean inmediatas]
- El dominio propio va **siempre a nombre de la clienta**. Axs le da una guía para conectarlo;
  que lo configure Axs es un extra. [Decidido]
- Si la clienta se va, se lleva su dominio. [Decidido]

## 8. Lo que no se hace ahora

**Hoja de ruta, sin fecha:**

- **Módulos pagos:** tienda virtual (rubros que venden), turnos (barberías), gestión de
  clientes, tarifas y cobros (creadoras de contenido) y eventos (sección 8.1). Cada uno es un
  producto entero; el primero se elige según lo que pidan las clientas reales. [Propuesta]
  - Primer paso chico para creadoras: bandeja en el panel con las propuestas que llegan por el
    formulario de contacto, y página de tarifas o media kit. [Propuesta]
- **Mercado Pago de la clienta** (que sus visitantes le paguen a ella): se posterga hasta que
  exista el primer módulo que cobre. Cuando se haga, la clienta vincula su cuenta ella misma
  desde una pantalla de "Integraciones", sin que Axs vea sus credenciales. [Decidido postergar]
  - La vinculación se hace con el botón "Conectar Mercado Pago" (autorización OAuth): la
    clienta inicia sesión en Mercado Pago y autoriza a la plataforma. No genera ni pega ningún
    token y nunca comparte su contraseña. La plataforma guarda en el servidor un permiso
    limitado que ella puede revocar desde su cuenta. [Propuesta, reemplaza la idea de explicarle
    cómo generar el token y dónde cargarlo]
- **Rubros más allá de los cuatro nombrados.**
- **Niveles de plan** (básico, pro). Se agregan solo si aparece demanda concreta.

### 8.1 Módulo de eventos

Para clientas que organizan eventos: dan de alta el evento con toda su información y la gente
compra o reserva su lugar desde el sitio. [Decidido que exista como módulo a futuro]

El caso que lo origina es una feria de emprendedores: se hace en predios o locales
gastronómicos, cada emprendedor paga por su stand y lo elige por número entre los disponibles,
y el público entra gratis. El módulo tiene que cubrir también eventos con entrada paga y eventos
sin lugares numerados pero con límite de personas. [Decidido]

**Cómo se cubre "cualquier variante":** un evento tiene uno o más **tipos de lugar**, y cada tipo
se define con tres datos. Todas las variantes salen de combinarlos. [Propuesta]

| Dato | Opciones |
|---|---|
| Para quién es | Público (entradas) o expositores (stands) |
| Cómo se cuenta | Numerado (cada lugar es único y se elige), por cupo (un total, sin lugar asignado) o sin límite |
| Precio | Pago, gratis con inscripción, o gratis sin inscripción |

Ejemplos:

- Feria de emprendedores: stands numerados y pagos para expositores; público sin límite y gratis
  sin inscripción.
- Taller con 30 lugares: público por cupo, pago.
- Charla gratuita con lugar limitado: público por cupo, gratis con inscripción.
- Cena con mesas: público numerado, pago.
- Varios precios en un mismo evento (preventa, general, stand chico y stand grande): son varios
  tipos de lugar, cada uno con su precio y su cantidad.

**Reglas que valen para todas las variantes:** [Propuesta]

- **Reserva temporal.** Al elegir un lugar queda apartado unos minutos mientras la persona paga.
  Si no paga, se libera solo. Es lo que impide vender dos veces el mismo stand.
- **El lugar se confirma cuando Mercado Pago avisa que el pago entró**, no cuando la persona
  vuelve al sitio.
- **Comprobante con código QR** por correo y lista de asistentes para controlar el ingreso.
- **El dinero va directo a la cuenta de Mercado Pago de la organizadora**, vinculada como se
  indica más arriba. Es el primer módulo que necesita esa vinculación.
- **Pago por transferencia:** el lugar queda "pendiente" hasta que la organizadora lo confirma a
  mano, con un plazo.

**Propio de los stands:** [Propuesta]

- El emprendedor completa los datos de su emprendimiento (nombre, rubro, redes).
- La organizadora puede pedir **aprobar al expositor antes de que pague**, para cuidar la mezcla
  de rubros de la feria.
- La página del evento puede mostrar sola la lista de emprendimientos confirmados.
- Mapa de stands: primero una lista numerada (libre, reservado, ocupado) junto a la imagen del
  plano que sube la organizadora, porque el lugar cambia en cada evento. El mapa interactivo
  queda para después.

**Sin decidir:** [Abierto, se define al diseñar el módulo]

- Si el módulo es para cualquier rubro o nace un rubro "organizadoras de eventos" con su molde.
- Si Axs cobra el módulo solo por mes o además retiene una comisión por venta. Mercado Pago
  permite retenerla en el mismo pago; hay que confirmar que la cuenta de Axs esté habilitada.
- Política de cancelación y devolución de cada evento, y qué pasa si el evento se suspende.
  Vender entradas tiene obligaciones hacia el comprador: confirmar con un contador.
- Lista de espera, entradas con horario y validación del QR con el celular en la puerta.

**Lo que haría de esto un fracaso aunque funcione:**

- Que una clienta pueda dejar su sitio feo con las herramientas del panel.
- Que el plan a medida tenga menos poder de edición que el genérico.
- Que Axs vea o guarde en claro credenciales de pago de una clienta.
- Que el dominio de la marca de una clienta quede a nombre de Axs.
- Que un sitio salga al público con contenido de ejemplo a nombre de la clienta.

## 9. Proyectos y orden

**Decisión:** se construye el producto completo y se publica recién cuando esté todo. No hay
apuro por vender. [Decidido]

| # | Proyecto | Qué entrega |
|---|---|---|
| 1 | Tests del CMS | La suite que hoy falta, para poder trabajar con test primero. |
| 2 | Biblioteca de secciones | Secciones con variantes, orden, paletas y estilo de animación; borrador, vista previa y publicación; el sitio de Sabrina rehecho encima con su diseño. |
| 3 | Molde de marca personal | Catálogo de secciones del rubro, siluetas, límite de lugares. |
| 4 | Suscripciones y cobros | Planes, extras, cupones, cobro automático y por transferencia, secuencia de impago, reportes, panel de Axs. |
| 5 | Alta con vista previa | Formulario, sitio generado, pago, accesos por correo, primeros pasos, alta hecha por Axs. |
| 6 | Sitio de Axs | Vidriera con planes y embudo. |
| 7 | Publicación | Deploy de producción, subdominios por sitio, dominios propios. Continúa `2026-11-chore-deploy-docker`, que queda en pausa hasta entonces. |

Los moldes de otros rubros que entren en el lanzamiento van después del proyecto 3.

### Enfoques considerados

**Sobre el orden:**

- *Producto completo primero* (elegido): cuando se sale a vender está todo automático. A cambio,
  pasan meses sin ingresos y el cobro automático y el alta sola se construyen sin saber todavía
  si el genérico se vende.
- *Vender a mano primero* (descartado por Fabricio): publicar antes, vender dando de alta a mano
  y cobrando por link o transferencia, y automatizar cuando haya clientas. Llega antes a la
  primera venta, pero con trabajo manual al principio. Se descartó porque no hay apuro.

**Sobre los rubros:**

- *Un molde por rubro, con núcleo compartido* (elegido): cada sitio se ve pensado para su rubro.
- *Un solo molde para todos* (descartado): se construye una vez, pero los sitios se parecen y lo
  propio de cada rubro no entra.

**Sobre el formulario de alta:**

- *Pedir lo mínimo* (elegido): menos abandono; la vista previa usa siluetas.
- *Pedir todo* (descartado): la vista previa sale con contenido real, pero el formulario es
  largo.

## 10. Qué queda para el diseño de cada proyecto

Decisiones técnicas que este documento no toma:

- Cómo se modelan las secciones en Payload. El ADR-002 eligió un global fijo de 13 bloques y
  descartó el modelo genérico de `docs/esquema.sql` (`tipos_seccion` + `secciones`); el proyecto
  2 tiene que reemplazar esa decisión con un ADR nuevo.
- Si los sitios genéricos son una sola aplicación para todas las clientas o una por sitio, y
  cómo conviven con los sitios a medida.
- Cómo se implementan borrador, vista previa y versiones.
- Cómo se cobra la suscripción con Mercado Pago y cómo se aplican los cupones.
- El modelo de datos de suscripciones, pagos y extras. Las tablas `suscripciones`,
  `mantenimientos` y `pagos` de `docs/esquema.sql` responden al modelo anterior (cuota con un
  cambio estructural incluido) y hay que revisarlas.
- Qué reglas de `docs/anti-ia-principios.md` valen para todos los sitios y cuáles son solo de
  Sabrina. Ese documento se escribió para su marca: la paleta rosa y marrón, la tipografía
  (Cormorant Garamond + Mulish) y la calibración de motion son de ella. Las reglas generales
  (un solo acento, sin etiquetas sobre fotos, motion sutil, copy) son las que este documento
  toma como límites del panel. El proyecto 2 tiene que separarlas.
- Cómo se generan los subdominios y se conectan los dominios propios. La vista previa (proyecto
  5) y la página de "sitio no disponible" (proyecto 4) necesitan distinguir un sitio de otro
  antes del proyecto 7: conviene resolver ese ruteo temprano y dejar el DNS real para el final.

**Restricciones que siguen valiendo:** el stack cerrado y las reglas anti-IA del `CLAUDE.md`, el
aislamiento entre clientas, que el contenido visible llegue siempre desde el CMS, y los
expedientes forge como forma de trabajo.

**Documentos actualizados al aprobar este (2026-11-25):** el principio rector y la lista de
documentos fuente del `CLAUDE.md`, una nota en el PRD que remite acá, y el roadmap de
`docs/arquitectura/overview.md`.
