# Prompt gambar pusaka (dunia Gaib)

Delapan benda, satu untuk setiap project. Semuanya harus terlihat seperti satu sesi
foto yang sama: latar, cahaya, sudut kamera, dan ukuran benda di bingkai dibuat sama.

## Cara pakai

1. Untuk setiap benda, salin **Resep gaya** lalu ganti `[BENDA]` dengan deskripsi
   benda dari tabel di bawah. Prompt-nya sengaja ditulis dalam bahasa Inggris karena
   generator gambar paling patuh pada bahasa Inggris.
2. Buat 3–4 variasi, lalu pilih yang paling mirip dengan gambar-gambar sebelumnya.
3. Setelah ada satu gambar yang bagus, jadikan itu acuan gaya untuk gambar berikutnya:
   - **ChatGPT / Gemini**: lampirkan gambar pertama, lalu tambahkan
     "Match the exact lighting, background, camera angle and framing of the attached image."
   - **Midjourney**: tambahkan `--ar 1:1 --style raw` dan `--sref <URL gambar pertama>`.
4. Simpan di folder ini dengan nama file **persis** seperti di tabel, misalnya
   `assets-src/pusaka/gais.png`. Ukuran minimal 1024×1024, format PNG atau JPG.
   Kompresi dan pemasangan ke situs nanti dikerjakan Claude.

## Resep gaya (sama untuk semua)

```
Studio product photograph of [BENDA], an antique Indonesian heirloom object.
Centered, three-quarter view from slightly above, the object fills about 60% of a
square frame with generous empty space around it.
Background: seamless warm near-black (#140A08), no table edge, no horizon, nothing
else in the frame.
Lighting: one low warm candle light from the lower left, a thin muted coral
(#E05A4E) rim light from behind, deep soft shadows, a faint wisp of incense smoke
drifting behind the object.
Aged, real, tactile materials. Cinematic, photorealistic, 50mm lens, shallow depth
of field.
No text, no letters, no numbers, no logos, no hands, no people, no ritual symbols,
no skulls, no blood. Square 1:1.
```

## Delapan benda

| File | Project | Pusaka | `[BENDA]` |
|---|---|---|---|
| `gais.png` | GAIS | Kunci serenceng | a heavy iron key ring holding many old brass and iron keys of different sizes, tied with a faded red thread |
| `modul.png` | Modul | Lontar | a bundle of palm-leaf lontar manuscript strips bound with string between two carved wooden covers, slightly fanned open, the leaves carry only faint abstract incised lines and no readable script |
| `unboxing.png` | Unboxing | Peti pusaka | a small antique teak chest with brass corners, the lid slightly open with a soft golden glow coming from inside |
| `completemulia.png` | Complete Mulia | Cincin akik | a men's silver ring set with a large polished deep red agate stone, standing upright |
| `oceanmall.png` | OceanMall | Pundi bertuah | a small worn leather pouch tied with a braided cord, a few plain old copper coins with no markings spilling out |
| `tixid.png` | Tixid | Wayang kulit | a single Javanese wayang kulit shadow puppet of a generic noble figure, intricately perforated painted hide with gold leaf, standing upright on its horn control rods |
| `helpdesk.png` | Helpdesk | Kentongan | a traditional bamboo kentongan slit drum hanging from a short rope, with a small wooden beater beside it |
| `shoestore.png` | ShoeStore | Terompah | a pair of old carved wooden terompah sandals with a worn leather strap across each |

## Kalau hasilnya meleset

- **Latar tidak hitam polos**: tambahkan "pure flat dark background, no gradient
  floor, no surface".
- **Muncul tulisan atau aksara**: ulangi "no text, no script, no letters" di awal
  prompt.
- **Wayang terlihat aneh** (tangan atau wajah rusak): minta "seen from the side, in
  classic flat profile like a real wayang kulit".
- **Satu benda tetap jelek setelah beberapa kali dicoba**: tidak apa-apa, beri tahu
  Claude. Bendanya bisa diganti dengan benda lain yang maknanya masih nyambung.
