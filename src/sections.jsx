import React, { useEffect } from "react";
import { projectHref, rememberScroll } from "./router";
import { asset } from "./asset";
import { Dot } from "./Orb";
import { COPY } from "./copy";
import ProjectMedia from "./ProjectMedia";

// The world copy, read from <html data-dunia> when a page does not pass it.
const worldCopy = (nyata) =>
  COPY[(nyata ?? document.documentElement.dataset.dunia === "nyata") ? "nyata" : "gaib"];

// A section heading: plain words, then the outlined word that ends in the
// crystal-ball full stop.
function Title({ id, words }) {
  return (
    <h2 id={id}>
      {words[0]} <span className="hollow">{words[1]}<Dot /></span>
    </h2>
  );
}

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

// The seeing lens over a heirloom: follows a mouse, ignores touch (touch
// screens get the vision on their own, in CSS).
function lens(e) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--x", e.clientX - r.left + "px");
  el.style.setProperty("--y", e.clientY - r.top + "px");
  el.classList.add("is-lensing");
}
function unlens(e) {
  e.currentTarget.classList.remove("is-lensing");
}
export { worldCopy };

export function ProjectList({ items, no, t }) {
  const c = t.projects;
  const plain = t === COPY.nyata;
  return (
    <section id="projects" className={"portfolio-section projects" + (plain ? " is-plain" : "")} aria-labelledby="projects-title">
      <header className="section-head reveal">
        <p className="section-kicker">{no} {c.kicker(pad(items.length))}</p>
        <Title id="projects-title" words={c.title} />
        <p className="section-lead">{c.lead}</p>
      </header>
      {plain ? (
        // NYATA: a grid to scan in one pass, every fact on the card.
        <ol className="project-grid">
          {items.map((item, i) => (
            <li key={item.id} className="project-card reveal" style={{ "--rd": (i % 2) * 0.12 + "s" }}>
              <a href={projectHref(item.id)} onClick={rememberScroll}>
                <span className="project-card-shot">
                  <ProjectMedia item={item} index={i} cta={c.link} />
                </span>
                <span className="project-card-meta">
                  {pad(i + 1)}
                  {item.year && <> · {item.year}</>}
                  {item.role && <> · {item.role}</>}
                </span>
                <h3>{item.name}</h3>
                <span className="project-card-summary">{item.summary}</span>
                <span className="project-card-stack">{item.stack}</span>
                <span className="project-card-link">
                  {c.link} <span aria-hidden="true">→</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="project-list">
          {items.map((item, i) => (
            <li key={item.id} className={"project-row reveal" + (i % 2 ? " is-flipped" : "")}>
              {item.pusaka?.image ? (
                // The heirloom, and behind it the vision: the project's real
                // screenshot, seen through a lens that follows the cursor. On a
                // touch screen the vision opens by itself once the row is in.
                <a
                  className="project-shot pusaka-stage"
                  href={projectHref(item.id)}
                  onClick={rememberScroll}
                  tabIndex={-1}
                  aria-hidden="true"
                  onPointerEnter={lens}
                  onPointerMove={lens}
                  onPointerLeave={unlens}
                >
                  <img className="pusaka-object" src={item.pusaka.image} alt="" loading="lazy" />
                  <span className="pusaka-vision">
                    <span className="project-parallax">
                      <ProjectMedia item={item} index={i} cta={c.link} />
                    </span>
                  </span>
                  <span className="pusaka-lens" />
                  <span className="pusaka-hint">{c.hint}</span>
                </a>
              ) : (
                <a className="project-shot" href={projectHref(item.id)} onClick={rememberScroll} tabIndex={-1} aria-hidden="true">
                  <span className="project-parallax">
                    <img className="project-screenshot" src={item.image} alt="" loading="lazy" />
                  </span>
                  {/* No heirloom yet: the project's logo plays first as the row
                      scrolls in, then the curtain lifts onto the screenshot. */}
                  <span className="project-logo" style={{ "--logo-bg": item.logoBg || "#1c0f0c" }}>
                    {item.logo ? (
                      <img className="project-logo-mark" src={item.logo} alt="" />
                    ) : (
                      <span className="project-logo-mark project-logo-text">{item.logoText || item.name}</span>
                    )}
                  </span>
                </a>
              )}
              <div className="project-info">
                <p className="project-index">
                  {pad(i + 1)}
                  {item.year && <> · {item.year}</>}
                </p>
                <h3>{item.name}</h3>
                <p className="project-tagline">{item.nameEn}</p>
                {item.pusaka && (
                  <p className="project-pusaka">
                    <span>Pusaka</span> {item.pusaka.name}. {item.pusaka.meaning}
                  </p>
                )}
                <p className="project-summary">{item.summary}</p>
                <p className="project-stack">{item.stack}</p>
                <a className="text-link" href={projectHref(item.id)} onClick={rememberScroll}>
                  {c.link} <span className="visually-hidden">{item.name}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function About({ profile, no, t }) {
  return (
    <section id="about" className="portfolio-section about" aria-labelledby="about-title">
      <div className="about-figure reveal">
        <img src={asset("/about.jpg")} alt={`Foto ${profile.name}`} loading="lazy" />
      </div>
      <div className="about-copy reveal">
        <p className="section-kicker">{no} {t.about.kicker}</p>
        <h2 id="about-title">{profile.name}</h2>
        <p className="about-role">
          {profile.role}
          {profile.location && <> · {profile.location}</>}
        </p>
        <p className="about-bio">{profile.bio}</p>
        {t.about.persona && <p className="about-persona">{t.about.persona}</p>}
      </div>
    </section>
  );
}

export function Experience({ experience = [], no, t }) {
  if (!experience.length) return null;
  return (
    <section id="experience" className="portfolio-section experience" aria-labelledby="experience-title">
      <header className="section-head reveal">
        <p className="section-kicker">{no} {t.experience.kicker}</p>
        <Title id="experience-title" words={t.experience.title} />
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

export function Certificates({ certificates = [], no, t }) {
  if (!certificates.length) return null;
  return (
    <section id="certificates" className="portfolio-section certificates" aria-labelledby="certificates-title">
      <header className="section-head reveal">
        <p className="section-kicker">{no} {t.certificates.kicker(pad(certificates.length))}</p>
        <Title id="certificates-title" words={t.certificates.title} />
        <p className="section-lead">{t.certificates.lead}</p>
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
                  {t.certificates.verify} <span className="visually-hidden">{cert.title}</span>
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

export function Contact({ profile, no, t }) {
  const links = contactLinks(profile.contacts);
  return (
    <section id="contact" className="portfolio-section contact" aria-labelledby="contact-title">
      <p className="section-kicker reveal">{no} {t.contact.kicker}</p>
      <div className="reveal">
        <Title id="contact-title" words={t.contact.title} />
      </div>
      <p className="section-lead reveal">{t.contact.lead}</p>
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

export function SiteFooter({ profile, nyata, onCross }) {
  const t = worldCopy(nyata);
  return (
    <footer className="site-footer">
      <span>
        © {new Date().getFullYear()} {profile.name}
      </span>
      {onCross && (
        <button type="button" className="footer-cross" onClick={() => onCross(nyata ? "gaib" : "nyata")}>
          <span className="footer-cross-ask">{nyata ? "Masih di dunia nyata?" : "Rindu dunia nyata?"}</span>{" "}
          {nyata ? "Masuk ke gaib" : "Kembali sadar"} <span aria-hidden="true">→</span>
        </button>
      )}
      <span>{t.footer(profile)}</span>
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
