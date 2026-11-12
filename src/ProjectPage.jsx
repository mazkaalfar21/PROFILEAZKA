import React, { useEffect } from "react";
import { projectHref } from "./router";
import { SiteFooter, useReveal } from "./sections";
import ProjectMedia from "./ProjectMedia";

const pad = (n) => String(n).padStart(2, "0");

// A case study for one project: what it solved, how, the main features and a
// small gallery. No 3D here; the page is meant to be read.
export default function ProjectPage({ items, profile, id }) {
  const index = items.findIndex((item) => item.id === id);
  const item = items[index];
  useEffect(() => {
    scrollTo(0, 0);
    document.title = item ? `${item.name} — ${profile.name}` : `Project tidak ditemukan — ${profile.name}`;
  }, [id]);
  useReveal([id]);

  if (!item)
    return (
      <div className="case">
        <CaseBar />
        <main className="case-main case-missing">
          <h1>Project ini tidak ditemukan.</h1>
          <a className="text-link" href="#projects">
            Lihat semua project <span aria-hidden="true">→</span>
          </a>
        </main>
      </div>
    );

  const prev = items[(index - 1 + items.length) % items.length];
  const next = items[(index + 1) % items.length];
  const links = item.links || {};
  return (
    <div className="case">
      <CaseBar />
      <main className="case-main">
        <header className="case-head">
          <p className="section-kicker">
            Studi kasus · {pad(index + 1)} / {pad(items.length)}
          </p>
          <h1>{item.name}.</h1>
          <p className="case-tagline">{item.nameEn}</p>
          <dl className="case-meta">
            {item.year && (
              <div>
                <dt>Tahun</dt>
                <dd>{item.year}</dd>
              </div>
            )}
            {item.role && (
              <div>
                <dt>Peran</dt>
                <dd>{item.role}</dd>
              </div>
            )}
            <div>
              <dt>Stack</dt>
              <dd>{item.stack}</dd>
            </div>
          </dl>
          {(links.live || links.repo || links.repos?.length > 0) && (
            <div className="case-actions">
              {links.live && (
                <a className="case-button" href={links.live} target="_blank" rel="noopener noreferrer">
                  Kunjungi situs <span aria-hidden="true">↗</span>
                </a>
              )}
              {links.repo && (
                <a className="case-button is-ghost" href={links.repo} target="_blank" rel="noopener noreferrer">
                  Lihat kode <span aria-hidden="true">↗</span>
                </a>
              )}
              {/* A project split across repositories (e.g. frontend and
                  backend) lists each with its own label. */}
              {links.repos?.map((repo) => (
                <a key={repo.href} className="case-button is-ghost" href={repo.href} target="_blank" rel="noopener noreferrer">
                  {repo.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
        </header>

        {/* The project's trailer plays here; its frames are decorative, so the
            figure carries the description. */}
        <figure className="case-hero reveal" role="img" aria-label={`Trailer ${item.name}: tampilan aplikasi, fitur utama, dan teknologinya`}>
          <ProjectMedia item={item} index={index} />
        </figure>

        <section className="case-story">
          <div className="reveal">
            <h2>Masalah</h2>
            <p>{item.problem}</p>
          </div>
          <div className="reveal">
            <h2>Solusi</h2>
            <p>{item.solution}</p>
          </div>
        </section>

        {item.features?.length > 0 && (
          <section className="case-features reveal">
            <h2>Fitur utama</h2>
            <ul>
              {item.features.map((feature, i) => (
                <li key={i}>
                  <span className="case-feature-index">{pad(i + 1)}</span>
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.gallery?.length > 0 && (
          <section className="case-gallery">
            <h2 className="reveal">Galeri</h2>
            {item.gallery.map((shot) => (
              <figure key={shot.src} className="reveal">
                <img src={shot.src} alt={shot.caption} loading="lazy" />
                <figcaption>{shot.caption}</figcaption>
              </figure>
            ))}
          </section>
        )}
      </main>

      <nav className="case-nav" aria-label="Project lain">
        <a href={projectHref(prev.id)}>
          <span>← Sebelumnya</span>
          <strong>{prev.name}</strong>
        </a>
        <a href={projectHref(next.id)} className="is-next">
          <span>Berikutnya →</span>
          <strong>{next.name}</strong>
        </a>
      </nav>
      <SiteFooter profile={profile} />
    </div>
  );
}

function CaseBar() {
  return (
    <header className="case-bar">
      <a className="wordmark" href="#home" aria-label="Kembali ke beranda">
        Dukun
      </a>
      <a className="text-link" href="#projects">
        <span aria-hidden="true">←</span> Semua project
      </a>
    </header>
  );
}
