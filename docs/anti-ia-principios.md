# Módulo anti-IA — para el design brief de Sabrina

*Destilado de las skills Impeccable, taste-skill y Emil Kowalski, filtrado y traducido para la estética de Sabrina (elegante, femenina, aireada, rosa/marrón, motion sutil). Esto se pega dentro del design brief como instrucciones para que no parezca generado por IA.*

---

## 0. Calibración (los "diales" para esta marca)

No usar la configuración agresiva por defecto. Para esta marca:

- **Variación: baja-media.** Layouts limpios y respirados, no caóticos.
- **Motion: bajo.** Movimiento sutil y motivado, nunca cinematográfico-recargado.
- **Densidad: muy baja.** Mucho espacio en blanco, secciones que respiran (paddings generosos).

Regla base: cuando dudes, quitá, no agregues.

---

## 1. La trampa más importante para ESTA paleta (rosa + marrón)

El cliché de IA de 2026 para marcas cálidas/femeninas/artesanales es exactamente **fondo crema/beige near-white + acentos bronce/arcilla/ocre + texto espresso**. Familias de color prohibidas como default: fondos tipo `#f5f1ea`, `#faf7f1`, `#efeae0`; acentos tipo `#b08947`, `#b6553a`, `#9c6e2a`. Si la paleta rosa/marrón se desliza hacia ahí, la marca se vuelve invisible (todas las webs "cálidas" de IA usan esa paleta).

**Cómo evitarlo:** que los rosas y marrones sean **específicos e intencionales** (tonos elegidos con saturación real, no un crema casi blanco genérico). La calidez la cargan el acento, la tipografía y las fotos — NO un fondo crema por defecto. Elegir un rosa y un marrón propios y bloquearlos para toda la página.

---

## 2. Tipografía

- **Prohibido Inter** como fuente de texto (es el tell número uno de IA).
- **Cuidado con el serif "creativo":** el reflejo "marca femenina/elegante = serif" es de los tells más detectados. Si se usa serif, que sea uno **específico y no cliché** — prohibidos `Fraunces` e `Instrument Serif` (los dos serifs favoritos de la IA). Para esta marca, un serif delicado bien elegido para títulos puede funcionar, pero hay que justificarlo; si no, un sans display elegante.
- Emparejar fuentes **por contraste** (serif + sans, o una sola familia en varios pesos). Nunca dos sans parecidas.
- Para enfatizar una palabra en un título: itálica o bold de **la misma** fuente, no meter un serif suelto en un título sans.
- Largo de línea de texto: 65–75 caracteres máximo.

---

## 3. Color

- **Un solo acento**, usado igual en toda la página (lock). Nada de un CTA rosa en una sección y un badge de otro color en otra.
- Nada de **gradiente en el texto** ni de glow violeta/azul de IA.
- Sombras **tintadas al tono del fondo** y muy difusas/suaves. Nunca negro puro (`#000`) ni sombras duras.
- Un solo sistema de bordes redondeados para toda la página (todo suave, por ejemplo radio 12–16px).
- Una sola modalidad de tema (acá: claro), no invertir secciones a media página.

---

## 4. Layout

- **Hero disciplinado:** entra completo en pantalla. Máximo 4 elementos de texto (etiqueta opcional, título de ≤2 líneas, subtexto corto ≤20 palabras, CTA). Nada de mini-tagline bajo el CTA ni tira de "usado por" dentro del hero.
- **Eyebrow con moderación:** la etiquetita en mayúsculas espaciadas arriba de CADA sección es un tell clásico. Máximo una cada tres secciones. En general, alcanza con el título.
- **Nada de numeritos de sección** (01 / 02 / 03) como decoración.
- **Nada de tres tarjetas iguales** en fila. Las cards, con moderación: agrupar con espacio en blanco o líneas finas, nunca tarjeta dentro de tarjeta.
- **No repetir la misma familia de layout** dos veces. Si una sección es "imagen + texto", la siguiente que sea distinta. Máximo dos "imagen+texto" seguidas.
- **Fotos grandes y reales** como protagonistas (su brief lo pide). El hero necesita una imagen real, no un bloque de color con texto.
- Contener el ancho (máx ~1400px) y centrar. Nav en una sola línea, baja (≤80px).

---

## 5. Motion

- Sutil y **motivado**: cada animación tiene que comunicar algo (jerarquía, secuencia, feedback). Si no podés justificarla en una frase, va afuera.
- **Regla de Emil:** si el usuario ve un elemento 100 veces por día, no lo animes.
- Curvas **ease-out** (exponenciales), nada de rebote ni elástico ni `linear`.
- Las entradas al hacer scroll, con `IntersectionObserver` o `whileInView`. **Nunca** `window.addEventListener('scroll')` (mata el rendimiento en mobile).
- `prefers-reduced-motion` obligatorio: todo el movimiento colapsa a estático.
- Animar solo `transform` y `opacity`.

---

## 6. Copy y contenido ficticio (para la primera versión)

- Nombres **realistas y locales** (de Formosa), nunca "Juan Pérez" ni marcas tipo "Acme/Nexus". Inventar marcas creíbles del rubro (cafetería, local de indumentaria, etc.).
- Testimonios: máximo 3 líneas, con **nombre + rol** (nunca solo el nombre). Que suenen humanos.
- Números **orgánicos**, no perfectos (no "50%" ni "10.000"; sí "esa semana sumó 1.200 visitas").
- **Sin verbos de relleno** ("Elevá", "Potenciá", "Revolucioná", "Sin fricción").
- **CERO em-dash (—) en toda la página.** Es el tell más violado. Usar punto, coma, paréntesis o dos puntos. Ni en títulos, ni en textos, ni en testimonios.

---

## 7. Lista rápida de "tells" prohibidos

- Cues de scroll ("Deslizá", flechita de mouse animada): el usuario ya sabe scrollear.
- Tiras de ciudad/hora/clima ("Formosa 14:23 · 24°C").
- Puntitos de estado de color decorativos en cada ítem/nav.
- Pills o etiquetas encima de las fotos (poner la leyenda debajo, fuera de la imagen).
- Labels de versión (V0.6, BETA) fuera de un lanzamiento real.
- Falsos screenshots hechos con `<div>`.
- SVG decorativos dibujados a mano (usar íconos de librería: Phosphor / Tabler).
- Líneas de "grilla" o crosshairs solo para "verse diseñado".

---

*Nota de uso: estas reglas anti-IA van en el `CLAUDE.md` del proyecto y aplican al construir el sitio de Sabrina (y de cualquier clienta) en Claude Code. Reforzarlas con la skill de gusto (Impeccable o taste-skill) para que se apliquen también sobre el código real. La paleta rosa/marrón y la tipografía son específicas de Sabrina; las reglas generales (tells, layout, motion, copy) valen para todas.*
