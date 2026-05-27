import Head from 'next/head';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function NosotrosPage() {
  return (
    <>
      <Head>
        <title>Nosotros | 525hp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Conocé la visión detrás de 525hp y cómo transformamos piezas automotrices en objetos de diseño."
        />
      </Head>

      <div className="about-page">
        <Header actionHref="/#catalogo" actionLabel="Ver colección" />

        <main className="about-page-main">
          <section className="about-page-hero">
            <div className="hero-lines about-page-lines" aria-hidden="true">
              <span className="hero-line hero-line-blue"></span>
              <span className="hero-line hero-line-gold"></span>
              <span className="hero-line hero-line-red"></span>
            </div>

            <div className="container about-shell">
              <section className="about-stage">
                <div className="about-stage-heading">
                  <p className="eyebrow">Nuestra visión</p>
                  <h1>Diseño automotriz convertido en presencia</h1>
                  <p className="about-page-description">
                    En 525hp reinterpretamos piezas icónicas del universo automotor para darles una segunda vida como
                    muebles y objetos de lujo. Nuestro enfoque combina precisión técnica, estética contemporánea y una
                    obsesión por los detalles que convierten cada pieza en una declaración visual.
                  </p>
                  <p className="about-page-description">
                    Cada creación busca transmitir carácter, exclusividad y una conexión real con la ingeniería que la
                    inspira. No diseñamos solo para exhibir un objeto: diseñamos para capturar la emoción que provoca
                    una máquina excepcional y llevarla al espacio cotidiano.
                  </p>
                </div>
              </section>

              <aside className="about-visual-panel" aria-label="Espacio reservado para fotografía de la marca">
                <div className="about-visual-card">
                  <p className="about-visual-eyebrow">Próximamente</p>
                  <div className="about-photo-placeholder">
                    <span>Espacio reservado para foto de presentación</span>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
