# Prepkit

A local, browser-based interview practice kit. It has separate daily and practice views, JavaScript coding checks, system design notes, and a persistent session history.

## Run locally

From this folder, start a small local server:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>. The app uses `content.json` as its local practice-content source. Progress, code drafts, and system design notes stay in this browser's local storage.

The coding checker runs JavaScript solutions in a short-lived Web Worker with a two-second time limit. It checks the sample cases included with each prompt; it is a focused local practice aid, not a full online judge with hidden tests or support for other languages.

## Update the practice content

Edit `content.json` to add coding problems, system design prompts, and trend briefings. Keep the existing fields and sample-case format so the app can render and check the content. The scheduled refresh is configured to update this data file while leaving the UI code alone.
