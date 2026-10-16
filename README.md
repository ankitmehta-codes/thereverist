# The Reverist — thereverist.in

A small, fully self-contained website. No third-party scripts, fonts, trackers or services: everything (including the fonts) lives in this folder.

## What's inside

- `index.html` — today's line, full screen. "Another line" shows a new one; "Save as post" and "Save as wallpaper" download the line as an image in the brand design.
- `archive.html` — every line, filterable by mood and searchable.
- `about.html` — what a reverist is, the Sunday line, and how to send a line.
- `404.html` — shown for any address that doesn't exist.
- `assets/lines.js` — **the only file you edit to add lines.**
- `assets/style.css`, `assets/app.js` — design and behaviour.
- `assets/fonts/` — Cormorant Garamond and Jost (open font licence, included).
- `CNAME` — tells GitHub Pages to use thereverist.in.

The site switches to night mode from 6pm to 6am on each visitor's own clock, and to day mode otherwise. Visitors can switch it for their visit using the button in the top corner.

## Adding a new line

Open `assets/lines.js` on GitHub, click the pencil icon, and add a new entry at the top of the list:

```js
{ id: 22, text: "Your new line here.", mood: "time", added: "2026-10-17" },
```

- Give each line a new, unique `id` (one higher than the last).
- `mood` must be one of: `solitude`, `time`, `love`, `self`, `change`.
- For your own lines, add `by: "Ankit Mehta",` and the credit appears under the line.
- Mind the quotes: if a line contains a double quote ("), type it as \" .

Click **Commit changes**. The site updates within a minute or two.

## Putting it online (one-time setup)

1. Create a free GitHub account, then a new **public** repository named `thereverist`.
2. Upload everything in this folder to the repository (drag and drop on the repository page works), and commit.
3. In the repository, go to **Settings → Pages**. Under "Build and deployment", choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. Still in Settings → Pages, set **Custom domain** to `thereverist.in` and save.
5. In GoDaddy, open the DNS settings for thereverist.in and add:
   - Four **A** records with name `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (remove any other A record for `@`, such as GoDaddy's parking page).
   - One **CNAME** record with name `www` pointing to `YOUR-GITHUB-USERNAME.github.io`.
6. Wait for DNS to update (often under an hour, sometimes up to a day), then go back to Settings → Pages and tick **Enforce HTTPS**.

## The Sunday line and submissions

GitHub Pages can only serve files, so it can't collect email addresses by itself. Both the "subscribe" and "send us a line" links open an email to the.reverist.official@gmail.com with the subject already filled in. Keep subscribers in a list and send the Sunday line from that inbox with everyone in BCC.
