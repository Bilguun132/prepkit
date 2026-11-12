# Prepkit

A local, browser-based interview prep kit. It has a daily algorithm topic with animated concept walkthroughs, LeetCode practice links, system design prompts, and a persistent session history.

## Run locally

From this folder, start a small local server:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>. The app uses `content.json` as its local practice-content source. Progress, code drafts, and system design notes stay in this browser's local storage.

The algorithm lesson and its visual walkthroughs are local. Coding problems open on LeetCode, where you can practice in your preferred language and use its judge.

System design questions include a discussion guide and a **Show a strong example design** button. These are examples to learn from; other designs can also be valid when their tradeoffs fit the requirements.

## Update the practice content

Edit `topics.json` to add daily algorithm topics, concepts, sample questions, LeetCode links, and per-question visual steps. Edit `content.json` for system design prompts and trend briefings. The scheduled refresh updates the local topic data without changing the UI code.
