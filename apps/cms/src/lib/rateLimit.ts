/**
 * Rate limiter in-memory por IP con ventana fija.
 *
 * Decisión D1: ventana fija por clave (IP), 60 requests / 60 s.
 * Sin dependencias externas. Limitación declarada: el estado in-memory no
 * resiste múltiples instancias ni serverless — revisar al cablear el deploy
 * real (multi-instancia/edge). Deuda explícita para el incremento de deploy.
 *
 * La función es pura respecto de sus argumentos: `ahora` se inyecta para
 * facilitar testing y triangulación futura sin manipular Date.now().
 *
 * Evicción lazy: al procesar cada request se purgan del Map los buckets cuya
 * ventana ya expiró. Esto amortigua el crecimiento de memoria ante rotación de
 * IPs sin afectar el comportamiento 60/60s ni la API pública.
 */

const LIMITE = 60;        // requests máximas por ventana
const VENTANA_MS = 60_000; // 60 segundos en ms

interface Bucket {
  contador: number;
  inicioVentana: number;
}

// Estado in-memory del proceso. Compartido entre requests en la misma instancia.
const buckets = new Map<string, Bucket>();

export interface ResultadoRateLimit {
  /** Si la request está dentro del límite y debe procesarse. */
  permitido: boolean;
  /** Cuántas requests quedan disponibles en la ventana actual. */
  restantes: number;
  /** Epoch ms en que se reinicia la ventana actual. */
  reiniciaEn: number;
}

/**
 * Purga perezosa: elimina del Map los buckets con ventana ya vencida.
 * Se llama en cada invocación de consultarRateLimit para amortiguar el
 * crecimiento de memoria ante rotación de IPs (atacante o NAT).
 * Costo: O(n) sobre el tamaño actual del Map — aceptable dado que la
 * población real de IPs activas en una ventana de 60 s es acotada.
 */
function purgarExpirados(ahora: number): void {
  for (const [clave, bucket] of buckets) {
    if (ahora >= bucket.inicioVentana + VENTANA_MS) {
      buckets.delete(clave);
    }
  }
}

/**
 * Consulta el rate limit para una clave (típicamente IP).
 * Incrementa el contador si la request está permitida.
 *
 * @param clave - Identificador de la fuente (IP o "desconocido").
 * @param ahora - Timestamp epoch ms. Por defecto: Date.now(). Inyectable para tests.
 */
export function consultarRateLimit(
  clave: string,
  ahora: number = Date.now()
): ResultadoRateLimit {
  // Purga lazy de buckets expirados para contener el crecimiento de memoria.
  purgarExpirados(ahora);

  const bucket = buckets.get(clave);
  const esVentanaNueva = !bucket || ahora >= bucket.inicioVentana + VENTANA_MS;

  const estadoActual: Bucket = esVentanaNueva
    ? { contador: 0, inicioVentana: ahora }
    : bucket!;

  const reiniciaEn = estadoActual.inicioVentana + VENTANA_MS;

  if (estadoActual.contador >= LIMITE) {
    // No incrementamos — la ventana ya está agotada
    buckets.set(clave, estadoActual);
    return {
      permitido: false,
      restantes: 0,
      reiniciaEn,
    };
  }

  estadoActual.contador += 1;
  buckets.set(clave, estadoActual);

  return {
    permitido: true,
    restantes: LIMITE - estadoActual.contador,
    reiniciaEn,
  };
}
