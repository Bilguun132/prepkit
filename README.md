# Prepkit

A local, browser-based interview prep kit. It has a daily algorithm topic with animated concept walkthroughs, LeetCode practice links, system design prompts, and a persistent session history.

## Run locally

From this folder, start a small local server:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>. The app uses `topics.json` and `content.json` as local practice-content sources. Progress and system design notes stay in this browser's local storage.

The algorithm lesson and its visual walkthroughs are local. Coding problems open on LeetCode, where you can practice in your preferred language and use its judge.

System design questions include a discussion guide and a **Show a strong example design** button. These are examples to learn from; other designs can also be valid when their tradeoffs fit the requirements.

## Update the practice content

Edit `topics.json` to add daily algorithm topics, concepts, sample questions, LeetCode links, and per-question visual steps. Edit `content.json` for system design prompts and trend briefings. The daily scheduled refresh appends one new algorithm topic to `topics.json` and one system design scenario plus worked example to `content.json`. The newest entries become the daily lessons, and the topic and system design libraries let you browse older material. The refresh should preserve existing entries and never overwrite the UI code.

## Publish with GitHub Pages

The repository includes a GitHub Actions workflow that deploys the static site whenever `main` is pushed. To publish it, add a GitHub remote, push `main`, and enable GitHub Pages with **GitHub Actions** as the publishing source under the repository's Pages settings. On GitHub Free, the repository needs to be public for Pages hosting.
