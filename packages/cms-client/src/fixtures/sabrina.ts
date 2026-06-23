import type { SitioSabrina } from "../tipos";

/**
 * Contenido ficticio realista del sitio de Sabrina. Reemplaza temporalmente lo
 * que servirá la API del CMS: cuando Payload esté arriba, obtenerSitioSabrina()
 * traerá esto de la base y el sitio no se entera. Los iconos son nombres de
 * Phosphor. Las imagenes viven en public/assets del sitio.
 */
export const sitioSabrina: SitioSabrina = {
  config: {
    nombre: "Sabrina Báez",
    acento: "#D98BA0",
    acentoSuave: "#F3D9DD",
    whatsapp: "5493704000000",
    instagram: "https://instagram.com/sabrinabaezj",
    tiktok: "https://tiktok.com/@sabrinabaezjuna",
  },

  hero: {
    ctaPrimario: "Trabajemos juntas",
    ctaSecundario: "Ver lo que hago",
    escenas: [
      {
        etiqueta: "Formosa, Argentina",
        titulo: "creadora de\ncomunidad",
        copete:
          "Creo contenido para mostrar lo que hacés. Pero lo que más me importa es lo que pasa después: la comunidad que se arma alrededor.",
        imagen: { url: "/assets/hero-1.png", textoAlternativo: "Sabrina Báez" },
      },
      {
        etiqueta: "Contenido con intención",
        titulo: "tu marca,\ncomo es",
        copete:
          "Grabo en tu local, en tu día real. Sin montajes que no te representan, sin sonar a agencia.",
        imagen: { url: "/assets/hero-2.png", textoAlternativo: "Sabrina grabando contenido" },
      },
      {
        etiqueta: "Lo que queda",
        titulo: "personas que\nse acompañan",
        copete:
          "Detrás de cada reel hay algo más grande: gente que se anima, se conoce y crece junto a otras.",
        imagen: { url: "/assets/hero-3.png", textoAlternativo: "Sabrina Báez" },
      },
    ],
  },

  sobreMi: {
    copete: "Hola, soy Sabrina",
    titulo: "Empecé creando, y descubrí que lo mío era ayudar a otras a animarse.",
    parrafos: [
      "Arranqué creando contenido y con mi propia marca de accesorios. En el camino me di cuenta de algo: lo que más disfruto no es la cámara, es ver a otra persona soltarse y mostrar lo que hace con orgullo.",
      "Hoy acompaño a marcas y a mujeres emprendedoras de Formosa a contar su historia de una forma que se sienta propia. Sin fórmulas, sin sonar a agencia. Con tiempo y con cariño.",
    ],
    imagen: { url: "/assets/hero-1.png", textoAlternativo: "Sabrina Báez" },
  },

  proposito: {
    icono: "flower-lotus",
    texto:
      "No hago contenido para juntar likes. Lo hago para crear conexiones reales, para que algo cambie de verdad cuando nos encontramos.",
  },

  pilares: {
    titulo: "Todo lo que hago",
    copete:
      "Cuatro formas de trabajar que se sostienen entre sí. El contenido abre la puerta, la comunidad es lo que queda.",
    pilares: [
      {
        icono: "video-camera",
        titulo: "Creación de contenido",
        descripcion:
          "Reels, carruseles y fotos que muestran tu marca como es. Grabo en tu local, en tu día real, sin montajes que no te representan.",
        nota: "la herramienta",
        variante: "grande",
      },
      {
        icono: "chalkboard-simple",
        titulo: "Capacitaciones",
        descripcion: "Talleres para que aprendas a mostrar lo que hacés sin depender de nadie.",
        variante: "compacto",
      },
      {
        icono: "confetti",
        titulo: "Eventos",
        descripcion: "Encuentros pensados para que las personas conecten, no para llenar una sala.",
        variante: "compacto",
      },
      {
        icono: "users-three",
        titulo: "Comunidad",
        descripcion:
          "El lugar donde todo lo anterior se sostiene. No es una audiencia: son personas que se acompañan y crecen juntas.",
        nota: "lo que queda",
        variante: "banda",
      },
    ],
  },

  pack: {
    etiqueta: "Para marcas",
    titulo: "Pack de Contenido",
    descripcion:
      "Una producción completa para tu local, pensada de principio a fin. Llego, grabo y te dejo todo listo para seguir usando.",
    incluye: [
      "Un reel pensado para tu marca",
      "Un carrusel para contar algo que importa",
      "Producción en tu local y tu horario",
      "Asesoramiento mientras grabamos",
      "Edición completa",
      "Un Drive con el material y recursos",
    ],
    cita: "Te llevás herramientas, no solo videos.",
    imagen: { url: "/assets/hero-2.png", textoAlternativo: "Sabrina grabando contenido" },
  },

  comoTrabajo: {
    copete: "Cómo trabajo",
    titulo: "Mientras grabo, también te miro a vos.",
    pasos: [
      {
        numero: "i.",
        titulo: "Observo cómo comunica tu marca",
        descripcion:
          "Mientras armo las tomas, presto atención a cómo le hablás a tus clientes y qué es lo que te hace distinta.",
      },
      {
        numero: "ii.",
        titulo: "Anoto las oportunidades que pasan de largo",
        descripcion:
          "Esos detalles que ya tenés y no estás aprovechando: un ritual, un producto, una forma de atender que merece contarse.",
      },
      {
        numero: "iii.",
        titulo: "Te dejo ideas para seguir usando",
        descripcion:
          "Cuando me voy, te queda más que el material: una forma de comunicar que podés repetir sola.",
      },
    ],
  },

  experiencias: {
    titulo: "Experiencias y encuentros",
    copete:
      "Cada encuentro nace de la misma idea: juntar personas que tienen algo para mostrar y darles un lugar lindo para hacerlo.",
    experiencias: [
      {
        titulo: "La Tarde Creativa",
        descripcion: "Tres ediciones: Bosque Encantado, Florecer y la primera de todas.",
        imagen: { url: "/assets/event-1.jpg", textoAlternativo: "La Tarde Creativa" },
      },
      {
        titulo: "Movimiento Emprendedor",
        descripcion: "Una tarde para conocernos entre emprendedoras de la ciudad.",
        imagen: { url: "/assets/event-2.jpg", textoAlternativo: "Movimiento Emprendedor" },
      },
    ],
    tambienOrganizo: [
      { icono: "coffee", texto: "Coffee Dates" },
      { icono: "flower", texto: "Ediciones temáticas" },
    ],
  },

  testimonios: {
    titulo: "Lo que cuentan ellas",
    testimonios: [
      {
        cita: "Después de su producción nos empezaron a escribir clientes nuevos. Entendió de qué se trata el café antes de prender la cámara.",
        nombre: "Maca",
        rol: "Almendra Café",
        destacado: true,
      },
      {
        cita: "Me daba mucha vergüenza mostrarme. Sabri me ayudó a soltarme y hoy grabo mis propios reels.",
        nombre: "Caro",
        rol: "Boutique Lúa",
        destacado: false,
      },
      {
        cita: "No me llevé solo videos. Me llevé una forma de mostrar lo que hago todos los días.",
        nombre: "Lucía",
        rol: "Decó Hogar",
        destacado: false,
      },
    ],
  },

  marcas: {
    copete: "Marcas formoseñas que confiaron",
    marcas: ["Almendra Café", "Boutique Lúa", "Decó Hogar", "Hotel del Río", "Florería Camalote"],
  },

  faq: {
    titulo: "Preguntas frecuentes",
    items: [
      {
        pregunta: "¿Trabajás solo en Formosa?",
        respuesta:
          "Sí, Formosa es mi lugar y donde mejor me muevo. También viajo a localidades cercanas si el proyecto lo necesita, lo charlamos según el caso.",
      },
      {
        pregunta: "¿Necesito tener todo listo antes de grabar?",
        respuesta:
          "Para nada. Parte de mi trabajo es ayudarte a ordenar la idea. Llegamos a la grabación con un plan, pero lo armamos juntas.",
      },
      {
        pregunta: "¿Qué pasa después de la producción?",
        respuesta:
          "Te queda un Drive con todo el material editado y recursos para seguir usando. La idea es que no dependas de mí para mostrar lo que hacés.",
      },
      {
        pregunta: "¿Hacés eventos para marcas?",
        respuesta:
          "Sí, desde encuentros chicos y cuidados hasta experiencias temáticas más grandes. Cada uno se piensa según lo que querés generar.",
      },
    ],
  },

  contacto: {
    titulo: "Contame qué tenés en mente",
    descripcion:
      "Una marca que querés mostrar, un evento que soñás, o simplemente las ganas de animarte. Escribime y lo charlamos.",
  },

  redes: {
    nombre: "Sabrina Báez",
    descripcion:
      "Creadora de comunidad en Formosa. Contenido, capacitaciones y encuentros para crecer desde un lugar auténtico.",
    redes: [
      { icono: "instagram-logo", etiqueta: "@sabrinabaezj", url: "https://instagram.com/sabrinabaezj" },
      { icono: "tiktok-logo", etiqueta: "@sabrinabaezjuna", url: "https://tiktok.com/@sabrinabaezjuna" },
    ],
    ubicacion: "Formosa, Argentina",
    nota: "Una marca que recién empieza, hecha para crecer.",
  },
};
