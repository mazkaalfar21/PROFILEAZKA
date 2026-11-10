import React, { useEffect } from "react";
import { projectHref, rememberScroll } from "./router";
import { asset } from "./asset";

// Fade elements marked `.reveal` in as they scroll into view. CSS owns the
// motion (and drops it under reduced motion); this only flips the class.
export function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.is-in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps);
}

const pad = (n) => String(n).padStart(2, "0");

export function ProjectList({ items }) {
  return (
    <section id="projects" className="portfolio-section projects" aria-labelledby="projects-title">
      <header className="section-head reveal">
        <p className="section-kicker">Karya · {pad(items.length)} project</p>
        <h2 id="projects-title">
          Semua <span className="hollow">project</span>.
        </h2>
        <p className="section-lead">
          Dari panel internal kantor sampai toko online. Pilih satu untuk membaca
          cerita lengkapnya: masalahnya, solusinya, dan fitur yang dibangun.
        </p>
      </header>
      <ol className="project-list">
        {items.map((item, i) => (
          <li key={item.id} className={"project-row reveal" + (i % 2 ? " is-flipped" : "")}>
            <a className="project-shot" href={projectHref(item.id)} onClick={rememberScroll} tabIndex={-1} aria-hidden="true">
              <img className="project-screenshot" src={item.image} alt="" loading="lazy" />
              {/* The project's logo plays first as the row scrolls in, then
                  the curtain lifts onto the screenshot (CSS, keyed on .is-in). */}
              <span className="project-logo" style={{ "--logo-bg": item.logoBg || "#1c0f0c" }}>
                {item.logo ? (
                  <img className="project-logo-mark" src={item.logo} alt="" />
                ) : (
                  <span className="project-logo-mark project-logo-text">{item.logoText || item.name}</span>
                )}
              </span>
            </a>
            <div className="project-info">
              <p className="project-index">
                {pad(i + 1)}
                {item.year && <> · {item.year}</>}
              </p>
              <h3>{item.name}</h3>
              <p className="project-tagline">{item.nameEn}</p>
              <p className="project-summary">{item.summary}</p>
              <p className="project-stack">{item.stack}</p>
              <a className="text-link" href={projectHref(item.id)} onClick={rememberScroll}>
                Baca studi kasus <span className="visually-hidden">{item.name}</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function About({ profile }) {
  return (
    <section id="about" className="portfolio-section about" aria-labelledby="about-title">
      <div className="about-figure reveal">
        <img src={asset("/character.png")} alt="Karakter Dukun Gen Z, persona situs ini" loading="lazy" />
      </div>
      <div className="about-copy reveal">
        <p className="section-kicker">Tentang</p>
        <h2 id="about-title">{profile.name}</h2>
        <p className="about-role">
          {profile.role}
          {profile.location && <> · {profile.location}</>}
        </p>
        <p className="about-bio">{profile.bio}</p>
        <p className="about-persona">
          Dukun Gen Z adalah persona situs ini: ilmu lama, dunia baru. Sihirnya
          fiksi, kodenya nyata.
        </p>
      </div>
    </section>
  );
}

export function Experience({ experience = [] }) {
  if (!experience.length) return null;
  return (
    <section id="experience" className="portfolio-section experience" aria-labelledby="experience-title">
      <header className="section-head reveal">
        <p className="section-kicker">Pengalaman</p>
        <h2 id="experience-title">
          Jejak <span className="hollow">perjalanan</span>.
        </h2>
      </header>
      <ol className="timeline">
        {experience.map((job, i) => (
          <li key={i} className="timeline-item reveal">
            <p className="timeline-period">{job.period}</p>
            <div>
              <h3>{job.position}</h3>
              <p className="timeline-place">{job.place}</p>
              {job.points?.length > 0 && (
                <ul>
                  {job.points.map((point, j) => (
                    <li key={j}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Certificates({ certificates = [] }) {
  if (!certificates.length) return null;
  return (
    <section id="certificates" className="portfolio-section certificates" aria-labelledby="certificates-title">
      <header className="section-head reveal">
        <p className="section-kicker">Sertifikat · {pad(certificates.length)}</p>
        <h2 id="certificates-title">
          Ilmu yang <span className="hollow">tercatat</span>.
        </h2>
        <p className="section-lead">
          Kelas yang sudah diluluskan. Setiap sertifikat bisa diverifikasi langsung
          di situs penerbitnya.
        </p>
      </header>
      <ul className="cert-grid">
        {certificates.map((cert) => (
          <li key={cert.credentialId || cert.title} className="cert-card reveal">
            <a className="cert-image" href={cert.image} target="_blank" rel="noopener noreferrer">
              <img src={cert.image} alt={`Sertifikat ${cert.title} dari ${cert.issuer}`} loading="lazy" />
            </a>
            <div className="cert-body">
              <p className="cert-issuer">{cert.issuer}</p>
              <h3>{cert.title}</h3>
              <dl className="cert-meta">
                <div>
                  <dt>Lulus</dt>
                  <dd>{cert.date}</dd>
                </div>
                {cert.validUntil && (
                  <div>
                    <dt>Berlaku hingga</dt>
                    <dd>{cert.validUntil}</dd>
                  </div>
                )}
                {cert.credentialId && (
                  <div>
                    <dt>ID</dt>
                    <dd className="cert-id">{cert.credentialId}</dd>
                  </div>
                )}
              </dl>
              {cert.url && (
                <a className="text-link" href={cert.url} target="_blank" rel="noopener noreferrer">
                  Verifikasi sertifikat <span className="visually-hidden">{cert.title}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const withScheme = (url) => (/^https?:\/\//.test(url) ? url : "https://" + url);
function contactLinks(contacts = {}) {
  const links = [];
  if (contacts.email) links.push({ label: "Email", value: contacts.email, href: "mailto:" + contacts.email });
  if (contacts.whatsapp)
    links.push({
      label: "WhatsApp",
      value: contacts.whatsapp,
      href: "https://wa.me/" + contacts.whatsapp.replace(/\D/g, "").replace(/^0/, "62"),
    });
  if (contacts.linkedin) links.push({ label: "LinkedIn", value: contacts.linkedin.replace(/^https?:\/\/(www\.)?/, ""), href: withScheme(contacts.linkedin) });
  if (contacts.github) links.push({ label: "GitHub", value: contacts.github.replace(/^https?:\/\/(www\.)?/, ""), href: withScheme(contacts.github) });
  return links;
}

export function Contact({ profile }) {
  const links = contactLinks(profile.contacts);
  return (
    <section id="contact" className="portfolio-section contact" aria-labelledby="contact-title">
      <p className="section-kicker reveal">Kontak</p>
      <h2 id="contact-title" className="reveal">
        Panggil <span className="hollow">dukunnya</span>.
      </h2>
      <p className="section-lead reveal">
        Punya project, lowongan, atau sekadar mau ngobrol soal kode? Pintu selalu
        terbuka, tanpa perlu sesajen.
      </p>
      <div className="contact-links reveal">
        {links.map((link) => (
          <a
            key={link.label}
            className="contact-link"
            href={link.href}
            {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <span className="contact-label">{link.label}</span>
            <span className="contact-value">{link.value}</span>
          </a>
        ))}
        {profile.cv && (
          <a className="contact-cv" href={profile.cv} download>
            Unduh CV <span aria-hidden="true">↓</span>
          </a>
        )}
      </div>
      {!links.length && !profile.cv && (
        <p className="contact-empty reveal">[ISI: kontak dan CV di public/profile.json]</p>
      )}
    </section>
  );
}

export function SiteFooter({ profile }) {
  return (
    <footer className="site-footer">
      <span>
        © {new Date().getFullYear()} {profile.name}
      </span>
      <span>
        Dukun ✳ ilmu lama, dunia baru.
      </span>
    </footer>
  );
}

export const SECTIONS = [
  ["projects", "Karya"],
  ["about", "Tentang"],
  ["experience", "Pengalaman"],
  ["certificates", "Sertifikat"],
  ["contact", "Kontak"],
];
