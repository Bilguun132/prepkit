# Prepkit

A local, browser-based interview prep kit. It has a daily algorithm topic with animated concept walkthroughs, LeetCode practice links, system design prompts, and a persistent session history.

## Run locally

From this folder, start a small local server:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>. The app uses `topics.json` and `content.json` as local practice-content sources. Progress and system design notes stay in this browser's local storage.

The algorithm lesson and its visual walkthroughs are local. Coding problems open on LeetCode, where you can practice in your preferred language and use its judge.

System design questions include a discussion guide and a **Show a strong example design** button. The worked example opens with a board showing how requests and data move between components. Technology labels on the board match the example stack below it, which explains each tool’s role and main tradeoff.

## Update the practice content

The daily refresh at 8 AM Singapore time prioritizes the curriculum gap that would most help someone prepare for an interview. It can improve an existing topic, expand its practice questions, or add a distinct topic. Keep existing IDs and question links so the libraries and saved notes still work.

- In `topics.json`, `featuredTopicId` chooses the coding lesson on Today. For a beginner lesson, add `lesson` with `intuition`, `terms` (pairs of `term` and `definition`), `steps`, and `check` (`question` and `answer`). Pair the lesson with a concrete animated example. Each question can include a `walkthrough` with `input`, `output`, `steps`, `whyItWorks`, `cost`, and `pitfall`. Use official LeetCode links and retain the per-question visual frames.
- In `content.json`, `featuredSystemId` chooses the system design case on Today. Each worked example in `systemSolutions` has a `board` with one or more flows. A flow has a `title` and ordered `steps`, each with a component `name` and a short `detail`. Use separate flows for distinct paths such as reads and writes.
- Give each new worked example a `stack` of concrete choices with `id`, `name`, `role`, `reason`, and `tradeoff`. Include the main storage, search, caching, and messaging technologies the design actually needs, and name the implementation of important custom services where it helps explain the design. Use a board step’s `stackIds` array to reference the choices it uses. Keep the roles consistent with the worked solution, including which system owns the data and which systems serve derived copies.
- Review engineering practice against primary sources daily. Set `trend.reviewed` when the research is complete. Change `trend.updated` only for a substantive update, keep prior briefings in `trendHistory`, and list the supporting `sources` with `title`, `url`, and `note`. Use ISO dates in Singapore time. Keep the existing `sourceTitle`/`sourceUrl` and `readingTitle`/`readingUrl`/`readingSummary` fields synchronized for the Today cards and archive.

If a featured ID is absent, Today uses the most recent library entry.

## Publish with GitHub Pages

The repository includes a GitHub Actions workflow that deploys the static site whenever `main` is pushed. To publish it, add a GitHub remote, push `main`, and enable GitHub Pages with **GitHub Actions** as the publishing source under the repository's Pages settings. On GitHub Free, the repository needs to be public for Pages hosting.
