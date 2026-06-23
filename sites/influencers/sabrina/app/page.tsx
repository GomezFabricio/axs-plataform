import type { CSSProperties } from "react";
import { obtenerSitioSabrina } from "@axs/cms-client";
import { enlaceWhatsapp } from "@/lib/sitio";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SobreMi } from "@/components/SobreMi";
import { Proposito } from "@/components/Proposito";
import { Pilares } from "@/components/Pilares";
import { Pack } from "@/components/Pack";
import { ComoTrabajo } from "@/components/ComoTrabajo";
import { Experiencias } from "@/components/Experiencias";
import { Testimonios } from "@/components/Testimonios";
import { Marcas } from "@/components/Marcas";
import { Faq } from "@/components/Faq";
import { Contacto } from "@/components/Contacto";
import { Footer } from "@/components/Footer";
import { WhatsappFlotante } from "@/components/WhatsappFlotante";

export default async function Pagina() {
  const sitio = await obtenerSitioSabrina();
  const waLink = enlaceWhatsapp(sitio.config.whatsapp);

  // El acento llega del contenido (config de la clienta) y se inyecta como CSS var.
  const estiloRaiz = {
    "--acento": sitio.config.acento,
    "--acento-suave": sitio.config.acentoSuave,
  } as CSSProperties;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: sitio.config.nombre,
    description: sitio.redes.descripcion,
    areaServed: "Formosa, Argentina",
    address: { "@type": "PostalAddress", addressLocality: "Formosa", addressCountry: "AR" },
    sameAs: sitio.redes.redes.map((r) => r.url),
  };

  return (
    <div style={estiloRaiz}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <span id="top" />
      <Header nombre={sitio.config.nombre} waLink={waLink} />
      <main>
        <Hero hero={sitio.hero} waLink={waLink} />
        <SobreMi sobreMi={sitio.sobreMi} />
        <Proposito proposito={sitio.proposito} />
        <Pilares pilares={sitio.pilares} />
        <Pack pack={sitio.pack} />
        <ComoTrabajo comoTrabajo={sitio.comoTrabajo} />
        <Experiencias experiencias={sitio.experiencias} />
        <Testimonios testimonios={sitio.testimonios} />
        <Marcas marcas={sitio.marcas} />
        <Faq faq={sitio.faq} />
        <Contacto contacto={sitio.contacto} waLink={waLink} />
      </main>
      <Footer redes={sitio.redes} />
      <WhatsappFlotante waLink={waLink} />
    </div>
  );
}
