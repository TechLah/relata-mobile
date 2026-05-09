# Relata

AI memory for the people you meet.

Relata is a mobile-first prototype for capturing a new contact from natural memory, source materials, and relationship context. The flow turns messy notes into a reviewable contact profile, enriches it with research suggestions, and proposes links to people already saved in the user's network.

## Current Prototype

- Voice-style memory capture and pasted source input
- Relationship lens selection
- Editable AI draft review
- Mock deep research enrichment
- Relationship suggestions
- Saved contact memory using local storage
- Demo-ready mobile web flow
- PWA metadata for add-to-home-screen testing

## Demo Flow

1. Open the app.
2. Tap `Demo` to load the Daniel Lee scenario and sample network.
3. Tap `Extract draft`.
4. Confirm the user-provided facts.
5. Review deep research findings.
6. Find relationship links.
7. Save the profile into Relata memory.

## Local Development

The app is currently a static mobile web prototype.

```bash
npm install
npm run dev
```

For a quick local file preview, open `index.html` directly in a browser. Service worker/PWA behavior only works from an HTTP server, not from `file://`.

## Deployment

Recommended demo deployment:

- Vercel
- Netlify
- GitHub Pages

Repository: `relata-mobile`
