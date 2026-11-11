// The words of each world. The facts (projects, experience, certificates,
// contacts) come from the JSON files and are the same in both; only the way
// they are told changes. NYATA says it plainly for someone hiring; GAIB keeps
// the Dukun persona. A heading is [plain part, outlined part]; the outlined
// part ends in the crystal-ball full stop.
export const COPY = {
  nyata: {
    nav: { projects: "Project", about: "Tentang", experience: "Pengalaman", certificates: "Sertifikat", contact: "Kontak" },
    projects: {
      kicker: (n) => `Project · ${n}`,
      title: ["Semua", "project"],
      lead: "Dari panel internal kantor sampai toko online. Setiap project punya studi kasus: masalahnya, solusinya, dan fitur yang dibangun.",
      link: "Lihat studi kasus",
    },
    about: { kicker: "Tentang", persona: null },
    experience: { kicker: "Pengalaman", title: ["Pengalaman", "kerja"] },
    certificates: {
      kicker: (n) => `Sertifikat · ${n}`,
      title: ["Sertifikat", "terverifikasi"],
      lead: "Kelas yang sudah diluluskan. Setiap sertifikat bisa diverifikasi langsung di situs penerbitnya.",
      verify: "Verifikasi sertifikat",
    },
    contact: {
      kicker: "Kontak",
      title: ["Mari", "bekerja sama"],
      lead: "Terbuka untuk project, lowongan, atau sekadar diskusi soal kode.",
    },
    footer: (profile) => [profile.location, "Indonesia"].filter(Boolean).join(", "),
  },
  gaib: {
    nav: { projects: "Pusaka", about: "Tentang", experience: "Riwayat", certificates: "Ijazah", contact: "Panggil" },
    projects: {
      kicker: (n) => `Pusaka · ${n} benda`,
      title: ["Koleksi", "pusaka"],
      lead: "Setiap karya disimpan sebagai pusaka. Terawang satu untuk melihat wujud aslinya: masalah yang diusir, solusi yang dirapal, dan fitur yang ditanam.",
      link: "Terawang pusaka",
      hint: "Arahkan kursor untuk menerawang",
    },
    about: {
      kicker: "Sang dukun",
      persona: "Dukun Gen Z adalah persona situs ini: ilmu lama, dunia baru. Sihirnya fiksi, kodenya nyata.",
    },
    experience: { kicker: "Riwayat perguruan", title: ["Jejak", "perjalanan"] },
    certificates: {
      kicker: (n) => `Ijazah ilmu · ${n}`,
      title: ["Ilmu yang", "tercatat"],
      lead: "Ilmu yang sudah dituntaskan, lengkap dengan cap penerbitnya. Boleh dicek keasliannya.",
      verify: "Cek keaslian",
    },
    contact: {
      kicker: "Panggil",
      title: ["Panggil", "dukunnya"],
      lead: "Punya project, lowongan, atau sekadar mau ngobrol soal kode? Pintu selalu terbuka, tanpa perlu sesajen.",
    },
    footer: () => "Dukun · ilmu lama, dunia baru.",
  },
};
