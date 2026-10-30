import { defineSnippets } from '../types'

export const htmlSnippets = defineSnippets('html', [
  {
    title: 'Document skeleton',
    code: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>`,
  },
  {
    title: 'Signup form',
    code: `
<form action="/subscribe" method="post">
  <label for="email">Email</label>
  <input id="email" type="email" required />
  <button type="submit">Subscribe</button>
</form>`,
  },
  {
    title: 'Navigation',
    code: `
<nav aria-label="Main">
  <ul>
    <li><a href="/" class="active">Home</a></li>
    <li><a href="/blog">Blog</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>`,
  },
  {
    title: 'Figure',
    code: `
<figure>
  <img src="lake.jpg" alt="A calm lake at sunrise" />
  <figcaption>Morning at the lake</figcaption>
</figure>`,
  },
  {
    title: 'Data table',
    code: `
<table>
  <thead>
    <tr><th>Name</th><th>Score</th></tr>
  </thead>
  <tbody>
    <tr><td>Ada</td><td>98</td></tr>
    <tr><td>Linus</td><td>91</td></tr>
  </tbody>
</table>`,
  },
  {
    title: 'Article',
    code: `
<article class="post">
  <header>
    <h2>Learning to Type Faster</h2>
    <time datetime="2024-03-14">March 14, 2024</time>
  </header>
  <p>Practice a little every day.</p>
</article>`,
  },
  {
    title: 'Select menu',
    code: `
<label for="size">Size</label>
<select id="size" name="size">
  <option value="s">Small</option>
  <option value="m" selected>Medium</option>
  <option value="l">Large</option>
</select>`,
  },
  {
    title: 'Video element',
    code: `
<video controls width="640" poster="cover.png">
  <source src="intro.webm" type="video/webm" />
  <source src="intro.mp4" type="video/mp4" />
  Your browser does not support video.
</video>`,
  },
  {
    title: 'Disclosure',
    code: `
<details>
  <summary>Show keyboard shortcuts</summary>
  <p>Press <kbd>Tab</kbd> then <kbd>Enter</kbd> to restart.</p>
</details>`,
  },
  {
    title: 'Head tags',
    code: `
<meta name="viewport" content="width=device-width" />
<meta name="description" content="A typing game" />
<link rel="stylesheet" href="styles.css" />
<script src="app.js" defer></script>`,
  },
])
