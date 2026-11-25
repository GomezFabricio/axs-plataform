import { Forbidden, NotFound } from "payload";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";
import { seedSabrina } from "@/seed/sabrina";
import type { Clienta, Medio } from "@/payload-types";
import {
  crearAdministradorAxs,
  crearClienta,
  crearEditora,
  imagenDePrueba,
  intentarVolverseAdministradora,
  obtenerPayloadDeTest,
  subirMedio,
} from "../soporte/fabricas";
import type { UsuarioDeTest } from "../soporte/fabricas";

/**
 * Aislamiento entre clientas: lo que una editora puede ver y tocar de otra. Las operaciones van
 * por la API local con las reglas de acceso activas (`overrideAccess: false`) y el usuario que
 * corresponde; sin usuario es el caso "sin sesión". Para comprobar que un dato no cambió o no se
 * borró se lo vuelve a leer con `overrideAccess: true`.
 */

let payload: Payload;

/** El id de una relación puede venir como número o como documento poblado. */
function idDe(relacion: number | { id: number } | null | undefined): number | undefined {
  return typeof relacion === "object" && relacion !== null ? relacion.id : (relacion ?? undefined);
}

/** Opciones que hacen correr las reglas de acceso reales como ese usuario (o sin sesión). */
function como(usuario?: UsuarioDeTest) {
  return {
    overrideAccess: false as const,
    ...(usuario ? { user: { ...usuario, collection: "usuarios" as const } } : {}),
  };
}

/** Lee el estado actual de la usuaria en la base, como lo vería su próximo inicio de sesión. */
async function recargar(usuaria: UsuarioDeTest): Promise<UsuarioDeTest> {
  const actual = await payload.findByID({
    collection: "usuarios",
    id: usuaria.id,
    overrideAccess: true,
  });
  return { ...actual, clave: usuaria.clave };
}

describe("aislamiento entre clientas", () => {
  let clientaA: Clienta;
  let clientaB: Clienta;
  let editoraA: UsuarioDeTest;
  let editoraB: UsuarioDeTest;
  let editoraSinClienta: UsuarioDeTest;
  let administradora: UsuarioDeTest;
  let medioA: Medio;
  let medioB: Medio;

  beforeAll(async () => {
    payload = await obtenerPayloadDeTest();
    clientaA = await crearClienta({ nombre: "Clienta A", slug: "aislamiento-a" });
    clientaB = await crearClienta({ nombre: "Clienta B", slug: "aislamiento-b" });
    editoraA = await crearEditora(clientaA);
    editoraB = await crearEditora(clientaB);
    editoraSinClienta = await crearEditora();
    administradora = await crearAdministradorAxs();
    medioA = await subirMedio(clientaA, "Foto de A");
    medioB = await subirMedio(clientaB, "Foto de B");
  });

  describe("editora de una clienta, sobre las clientas", () => {
    it("al listar clientas ve solo la suya", async () => {
      const { docs } = await payload.find({ collection: "clientas", ...como(editoraA) });
      expect(docs.map((d) => d.id)).toEqual([clientaA.id]);
    });

    it("no puede leer otra clienta por id", async () => {
      await expect(
        payload.findByID({ collection: "clientas", id: clientaB.id, ...como(editoraA) }),
      ).rejects.toBeInstanceOf(NotFound);
    });

    it("no puede crear una clienta", async () => {
      await expect(
        payload.create({
          collection: "clientas",
          data: { nombre: "Intrusa", slug: "aislamiento-intrusa" },
          ...como(editoraA),
        }),
      ).rejects.toBeInstanceOf(Forbidden);
      const { totalDocs } = await payload.count({
        collection: "clientas",
        where: { slug: { equals: "aislamiento-intrusa" } },
        overrideAccess: true,
      });
      expect(totalDocs).toBe(0);
    });

    it("no puede editar ni la suya ni otra clienta", async () => {
      // Clientas e editora propias del test: si la regla cayera, no se pisan las fixtures de los demás.
      const propia = await crearClienta();
      const ajena = await crearClienta();
      const editora = await crearEditora(propia);
      for (const clienta of [propia, ajena]) {
        await expect(
          payload.update({
            collection: "clientas",
            id: clienta.id,
            data: { nombre: "Nombre cambiado" },
            ...como(editora),
          }),
        ).rejects.toBeInstanceOf(Forbidden);
        const actual = await payload.findByID({
          collection: "clientas",
          id: clienta.id,
          overrideAccess: true,
        });
        expect(actual.nombre).toBe(clienta.nombre);
      }
    });

    it("no puede borrar ni la suya ni otra clienta", async () => {
      const propia = await crearClienta();
      const ajena = await crearClienta();
      const editora = await crearEditora(propia);
      for (const clienta of [propia, ajena]) {
        await expect(
          payload.delete({ collection: "clientas", id: clienta.id, ...como(editora) }),
        ).rejects.toBeInstanceOf(Forbidden);
        const sigue = await payload.findByID({
          collection: "clientas",
          id: clienta.id,
          overrideAccess: true,
        });
        expect(sigue.id).toBe(clienta.id);
      }
    });
  });

  describe("editora de una clienta, sobre los usuarios", () => {
    it("al listar usuarios ve solo los de su clienta", async () => {
      const { docs } = await payload.find({ collection: "usuarios", ...como(editoraA) });
      expect(docs.map((d) => d.id)).toContain(editoraA.id);
      expect(docs.map((d) => d.id)).not.toContain(editoraB.id);
      expect(docs.every((d) => idDe(d.clienta) === clientaA.id)).toBe(true);
    });

    it("no puede leer a la editora de otra clienta", async () => {
      await expect(
        payload.findByID({ collection: "usuarios", id: editoraB.id, ...como(editoraA) }),
      ).rejects.toBeInstanceOf(NotFound);
    });

    it("no puede editar a la editora de otra clienta", async () => {
      const ajena = await crearEditora(clientaB);
      await expect(
        payload.update({
          collection: "usuarios",
          id: ajena.id,
          data: { email: "cambiado@prueba.test" },
          ...como(editoraA),
        }),
      ).rejects.toBeInstanceOf(Forbidden);
      const actual = await payload.findByID({
        collection: "usuarios",
        id: ajena.id,
        overrideAccess: true,
      });
      expect(actual.email).toBe(ajena.email);
    });

    it("no puede borrar un usuario", async () => {
      // Usuarias propias del test: la actora, una compañera de su clienta y una de otra clienta.
      const actora = await crearEditora(clientaA);
      const companiera = await crearEditora(clientaA);
      const ajena = await crearEditora(clientaB);
      for (const usuario of [actora, companiera, ajena]) {
        await expect(
          payload.delete({ collection: "usuarios", id: usuario.id, ...como(actora) }),
        ).rejects.toBeInstanceOf(Forbidden);
        const sigue = await payload.findByID({
          collection: "usuarios",
          id: usuario.id,
          overrideAccess: true,
        });
        expect(sigue.id).toBe(usuario.id);
      }
    });
  });

  describe("editora de una clienta, sobre los medios", () => {
    it("al listar medios ve solo los de su clienta", async () => {
      const { docs } = await payload.find({ collection: "medios", ...como(editoraA) });
      expect(docs.map((d) => d.id)).toContain(medioA.id);
      expect(docs.map((d) => d.id)).not.toContain(medioB.id);
      expect(docs.every((d) => idDe(d.clienta) === clientaA.id)).toBe(true);
    });

    it("no puede leer el medio de otra clienta", async () => {
      await expect(
        payload.findByID({ collection: "medios", id: medioB.id, ...como(editoraA) }),
      ).rejects.toBeInstanceOf(NotFound);
    });

    it("no puede editar el medio de otra clienta", async () => {
      const ajeno = await subirMedio(clientaB, "Foto ajena para editar");
      await expect(
        payload.update({
          collection: "medios",
          id: ajeno.id,
          data: { textoAlternativo: "Texto cambiado" },
          ...como(editoraA),
        }),
      ).rejects.toBeInstanceOf(Forbidden);
      const actual = await payload.findByID({
        collection: "medios",
        id: ajeno.id,
        overrideAccess: true,
      });
      expect(actual.textoAlternativo).toBe("Foto ajena para editar");
    });

    it("no puede borrar el medio de otra clienta, que sigue existiendo", async () => {
      const ajeno = await subirMedio(clientaB, "Foto ajena para borrar");
      await expect(
        payload.delete({ collection: "medios", id: ajeno.id, ...como(editoraA) }),
      ).rejects.toBeInstanceOf(Forbidden);
      const sigue = await payload.findByID({
        collection: "medios",
        id: ajeno.id,
        overrideAccess: true,
      });
      expect(sigue.id).toBe(ajeno.id);
    });

    it("un medio que sube sin indicar clienta queda asignado a la suya", async () => {
      const imagen = imagenDePrueba();
      const medio = await payload.create({
        collection: "medios",
        data: { textoAlternativo: "Sin clienta indicada" },
        file: {
          data: imagen.contenido,
          mimetype: imagen.tipo,
          name: imagen.nombre,
          size: imagen.contenido.length,
        },
        ...como(editoraA),
      });
      const guardado = await payload.findByID({
        collection: "medios",
        id: medio.id,
        overrideAccess: true,
      });
      expect(idDe(guardado.clienta)).toBe(clientaA.id);
    });

    it("un medio que sube indicando otra clienta queda asignado a la suya", async () => {
      const imagen = imagenDePrueba();
      const medio = await payload.create({
        collection: "medios",
        data: { textoAlternativo: "Con clienta ajena", clienta: clientaB.id },
        file: {
          data: imagen.contenido,
          mimetype: imagen.tipo,
          name: imagen.nombre,
          size: imagen.contenido.length,
        },
        ...como(editoraA),
      });
      const guardado = await payload.findByID({
        collection: "medios",
        id: medio.id,
        overrideAccess: true,
      });
      expect(idDe(guardado.clienta)).toBe(clientaA.id);
    });

    it("no puede pasar su medio a otra clienta al editarlo", async () => {
      const propio = await subirMedio(clientaA, "Medio propio");
      await payload.update({
        collection: "medios",
        id: propio.id,
        data: { textoAlternativo: "Editado", clienta: clientaB.id },
        ...como(editoraA),
      });
      const guardado = await payload.findByID({
        collection: "medios",
        id: propio.id,
        overrideAccess: true,
      });
      expect(guardado.textoAlternativo).toBe("Editado");
      expect(idDe(guardado.clienta)).toBe(clientaA.id);
    });
  });

  describe("editora que intenta ampliar su propio acceso", () => {
    it("no puede cambiar su clienta al editarse a sí misma", async () => {
      const editora = await crearEditora(clientaA);
      await payload.update({
        collection: "usuarios",
        id: editora.id,
        data: { clienta: clientaB.id },
        ...como(editora),
      });
      const guardada = await payload.findByID({
        collection: "usuarios",
        id: editora.id,
        overrideAccess: true,
      });
      expect(idDe(guardada.clienta)).toBe(clientaA.id);
    });

    it("no consigue acceso a otras clientas al editarse a sí misma", async () => {
      const editora = await crearEditora(clientaA);
      await intentarVolverseAdministradora(editora);

      // Se vuelve a leer a la usuaria de la base: así se ve lo que quedó guardado de verdad.
      const actual = await recargar(editora);
      const { docs } = await payload.find({ collection: "clientas", ...como(actual) });
      expect(docs.map((d) => d.id)).toEqual([clientaA.id]);
      await expect(
        payload.findByID({ collection: "clientas", id: clientaB.id, ...como(actual) }),
      ).rejects.toBeInstanceOf(NotFound);
      await expect(
        payload.findByID({ collection: "medios", id: medioB.id, ...como(actual) }),
      ).rejects.toBeInstanceOf(NotFound);
    });
  });

  describe("editora sin clienta asignada", () => {
    it("no puede listar clientas", async () => {
      await expect(
        payload.find({ collection: "clientas", ...como(editoraSinClienta) }),
      ).rejects.toBeInstanceOf(Forbidden);
    });

    it("no puede listar usuarios", async () => {
      await expect(
        payload.find({ collection: "usuarios", ...como(editoraSinClienta) }),
      ).rejects.toBeInstanceOf(Forbidden);
    });

    it("no puede listar medios", async () => {
      await expect(
        payload.find({ collection: "medios", ...como(editoraSinClienta) }),
      ).rejects.toBeInstanceOf(Forbidden);
    });
  });

  describe("administradora de Axs", () => {
    it("al listar clientas ve a todas", async () => {
      const { docs } = await payload.find({
        collection: "clientas",
        limit: 100,
        ...como(administradora),
      });
      const ids = docs.map((d) => d.id);
      expect(ids).toContain(clientaA.id);
      expect(ids).toContain(clientaB.id);
    });

    it("al listar medios ve los de todas las clientas", async () => {
      const { docs } = await payload.find({
        collection: "medios",
        limit: 100,
        ...como(administradora),
      });
      const ids = docs.map((d) => d.id);
      expect(ids).toContain(medioA.id);
      expect(ids).toContain(medioB.id);
    });
  });

  describe("sin sesión", () => {
    it("no puede listar clientas", async () => {
      await expect(payload.find({ collection: "clientas", ...como() })).rejects.toBeInstanceOf(
        Forbidden,
      );
    });

    it("no puede listar usuarios", async () => {
      await expect(payload.find({ collection: "usuarios", ...como() })).rejects.toBeInstanceOf(
        Forbidden,
      );
    });

    it("puede listar medios, pero ningún medio revela a qué clienta pertenece", async () => {
      const { docs } = await payload.find({ collection: "medios", limit: 100, ...como() });
      expect(docs.map((d) => d.id)).toEqual(expect.arrayContaining([medioA.id, medioB.id]));
      for (const doc of docs) {
        expect(doc).not.toHaveProperty("clienta");
      }
    });
  });
});

describe("aislamiento del contenido del sitio", () => {
  let sabrina: Clienta;
  let editoraSabrina: UsuarioDeTest;
  let editoraOtra: UsuarioDeTest;
  let medioDeOtra: Medio;

  beforeAll(async () => {
    payload = await obtenerPayloadDeTest();
    await seedSabrina(payload);
    const { docs } = await payload.find({
      collection: "clientas",
      where: { slug: { equals: "sabrina" } },
      limit: 1,
      overrideAccess: true,
    });
    sabrina = docs[0]!;
    const otra = await crearClienta({ slug: "aislamiento-otra" });
    editoraSabrina = await crearEditora(sabrina);
    editoraOtra = await crearEditora(otra);
    medioDeOtra = await subirMedio(otra, "Foto de otra clienta");
  }, 120_000);

  it("la editora de la clienta del sitio puede leer el contenido", async () => {
    const sitio = await payload.findGlobal({ slug: "sitio-sabrina", ...como(editoraSabrina) });
    expect(sitio.config.nombre).toBeTruthy();
  });

  it("la editora de la clienta del sitio puede editar el contenido", async () => {
    await payload.updateGlobal({
      slug: "sitio-sabrina",
      data: { config: { nombre: "Nombre editado por la editora" } },
      ...como(editoraSabrina),
    });
    const guardado = await payload.findGlobal({ slug: "sitio-sabrina", overrideAccess: true });
    expect(guardado.config.nombre).toBe("Nombre editado por la editora");
  });

  it("la editora de otra clienta no puede leer el contenido", async () => {
    await expect(
      payload.findGlobal({ slug: "sitio-sabrina", ...como(editoraOtra) }),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it("la editora de otra clienta no puede editar el contenido", async () => {
    const antes = await payload.findGlobal({ slug: "sitio-sabrina", overrideAccess: true });
    await expect(
      payload.updateGlobal({
        slug: "sitio-sabrina",
        data: { config: { nombre: "Nombre pisado por otra clienta" } },
        ...como(editoraOtra),
      }),
    ).rejects.toBeInstanceOf(Forbidden);
    const guardado = await payload.findGlobal({ slug: "sitio-sabrina", overrideAccess: true });
    expect(guardado.config.nombre).toBe(antes.config.nombre);
  });

  it("sin sesión no se puede leer el contenido por la API local con acceso activo", async () => {
    await expect(payload.findGlobal({ slug: "sitio-sabrina", ...como() })).rejects.toBeInstanceOf(
      Forbidden,
    );
  });

  it("no se puede poner en una sección una foto de otra clienta", async () => {
    const antes = await payload.findGlobal({
      slug: "sitio-sabrina",
      depth: 0,
      overrideAccess: true,
    });
    await expect(
      payload.updateGlobal({
        slug: "sitio-sabrina",
        data: { sobreMi: { imagen: medioDeOtra.id } },
        ...como(editoraSabrina),
      }),
    ).rejects.toMatchObject({
      name: "ValidationError",
      data: { errors: [expect.objectContaining({ path: "sobreMi.imagen" })] },
    });
    const despues = await payload.findGlobal({
      slug: "sitio-sabrina",
      depth: 0,
      overrideAccess: true,
    });
    expect(despues.sobreMi.imagen).toBe(antes.sobreMi.imagen);
  });

  it("sí se puede poner en una sección una foto de la propia clienta", async () => {
    const propio = await subirMedio(sabrina, "Foto de Sabrina para el control positivo");
    await payload.updateGlobal({
      slug: "sitio-sabrina",
      data: { sobreMi: { imagen: propio.id } },
      ...como(editoraSabrina),
    });
    const guardado = await payload.findGlobal({
      slug: "sitio-sabrina",
      depth: 0,
      overrideAccess: true,
    });
    expect(guardado.sobreMi.imagen).toBe(propio.id);
  });
});
