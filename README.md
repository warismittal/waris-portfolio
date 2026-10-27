
# Waris · Built in the Quiet Hours

**Live site:** https://waris-portfolio-eta.vercel.app

An interactive portfolio set at my desk between midnight and 5 AM. It opens as a pencil sketch that you paint to life. From there, you sit in my chair, pull the lamp chain, wake the laptop, drink the coffee, and walk through seven chapters of my work: engineering, TEDxTIET, projects and art.

I'm Waris, a Computer Science student at Thapar Institute of Engineering and Technology (TIET), Patiala, graduating in 2028. I'm Executive Committee Lead (Creativity and Logistics) at TEDxTIET, the builder of VARWIX, and a freelance portrait artist since 2018.

---

## What's inside

| Chapter | What you'll find |
| --- | --- |
| **The Desk** (`#/`) | A pencil sketch that draws itself and that you paint into colour. Then the desk at midnight, seen from my chair. There's a pull-chain lamp with real swing physics, hand gestures (typing, sipping, writing), coffee that drains as the night goes on, a live laptop screen, pinned photos, keychains, curtains, and sunlight through the blinds at 5 AM. |
| **Masterclass** (`#/masterclass`) | A course-style overview: the chapters, the engineer, the organiser and the artist, achievements and skills. |
| **Groundwork** (`#/groundwork`) | Education (9.11 CGPA at TIET, school results), NCC, Model United Nations, debate, campus roles and certificates. |
| **TEDx Stage** (`#/stage`) | My TEDxTIET journey from Core Member to Executive Committee Lead to Executive Board, told on a scroll-driven stage with an LED wall, moving lights and live captions. |
| **Tech Expo** (`#/expo`) | Projects as expo booths, each with a live demo screen: VARWIX, Ideociety, Grabito, NeRF Vision, Customer Churn and a SQL project. Also a GitHub-style view. |
| **VARWIX Gallery** (`#/gallery`) | A 3D gallery corridor you walk through by scrolling, with ten of my drawings framed under spotlights. |
| **Shell** (`#/os`) | A macOS-style desktop with a working terminal. Try `help`, `whoami`, `projects` or `open varwix`. |
| **Sunrise** (`#/contact`) | How to reach me. |

---

## How it's built

- **Plain HTML, CSS and JavaScript (ES modules).** No framework and no build step; it deploys as a static site.
- **WebGL shader for the desk:** depth parallax, lamp and window lighting, hand-gesture transitions, swaying leaves and the watercolour reveal in the opening.
- **Verlet rope physics** for the lamp chain and keychains.
- **Web Audio API:** every sound is generated in the browser, so there are no audio files.
- **Python asset pipeline (OpenCV and NumPy)** in the full project zip: it aligns the hand frames, upscales the desk images, builds the gesture masks and pencil sketch, and cleans the artwork photos.
- **Tested with Playwright:** 69 browser checks covering the desk interactions, every chapter, the contact form, phone layouts and reduced motion.
- **Deployed on Vercel**, which redeploys automatically from this repository.

Everything is self-hosted (fonts, images, scripts). The site makes no requests to other servers.

---

## Repository layout

```
index.html          the page shell
vercel.json         Vercel headers and caching
_headers            the same headers for other static hosts
data/content.json   ALL the text: profile, education, projects, TEDx, art, quotes
css/                styles (base, desk, pages, stage)
js/
  main.js           router and transitions between chapters
  desk.js           the desk scene and its interactions
  desk-gl.js        the WebGL renderer
  desk-screen.js    the laptop screen
  rope.js           chain and keychain physics
  audio.js          generated sound
  pages/            one file per chapter
assets/
  desk/             desk photos (f1 to f4), sketch, lighting and gesture maps
  art/              my artworks
  photos/           TEDx and friends photos
  people/           ID portrait and team photo
  brand/            VARWIX logo
  fonts/            bundled fonts
  resume.pdf
```

---

## Editing the content

Almost all the text lives in **`data/content.json`**.

1. Open `data/content.json` on GitHub and click the **pencil icon**.
2. Edit the text between the quotes. Keep the commas, brackets and quote marks as they are.
3. Click **Commit changes**. The live site updates in about a minute.

| To change… | Edit this part of `content.json` |
| --- | --- |
| Name, headline, links | `profile` |
| Education and marks | `education` |
| Skills | `skills` |
| Projects (expo booths) | `projects` |
| TEDx roles (stage) | `leadership.stages` |
| Other roles | `leadership.other` |
| Achievements and certificates | `achievements` |
| Artwork titles and notes | `art` |
| Poster quotes | `quotes` |
| NCC, MUN, debate | `groundwork.service` |

**To replace an image:** open its folder, click **Add file → Upload files**, upload a file with **exactly the same name**, and commit. To add a new artwork, upload it to `assets/art/` and add an entry under `art` in `content.json`.

If an edit breaks the site, go to Vercel → **Deployments**, choose the last working version, then **⋯ → Promote to Production**.

---

## Run it locally

```
python3 -m http.server 4180
```

Run it from the repository folder, then open http://localhost:4180. Opening `index.html` directly from Finder won't work, because the site loads its content from `data/`.

---

## Notes

- The artwork titles, Core Member dates and the Executive Board role are marked "to confirm" and will be updated.
- The contact form needs a backend at `/api/v1/contact`; until one exists, it offers to send the message by email instead.
- All artworks are my own. Please don't reuse them without asking.

---

## Contact

- **Email:** warismittal40@gmail.com
- **GitHub:** [github.com/warismittal](https://github.com/warismittal)
- **LinkedIn:** [linkedin.com/in/waris-mittal](https://linkedin.com/in/waris-mittal)

Designed, coded and drawn by Waris, in the quiet hours.
