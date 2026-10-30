import { defineSnippets } from '../types'

export const cssSnippets = defineSnippets('css', [
  {
    title: 'Card',
    code: `
.card {
  padding: 24px;
  border-radius: 12px;
  background: #202227;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}`,
  },
  {
    title: 'Flex centering',
    code: `
.center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}`,
  },
  {
    title: 'Responsive grid',
    code: `
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}`,
  },
  {
    title: 'Media query',
    code: `
@media (max-width: 640px) {
  .sidebar {
    display: none;
  }

  .content {
    padding: 0 16px;
  }
}`,
  },
  {
    title: 'Custom properties',
    code: `
:root {
  --accent: #d5a66f;
  --radius: 8px;
}

.button {
  color: var(--accent);
  border-radius: var(--radius);
}`,
  },
  {
    title: 'Hover transition',
    code: `
.link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}

.link:hover,
.link:focus-visible {
  color: #d5a66f;
}`,
  },
  {
    title: 'Keyframes',
    code: `
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
  },
  {
    title: 'Pseudo element',
    code: `
.badge::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
  background: currentColor;
}`,
  },
  {
    title: 'Sticky header',
    code: `
header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
  background: rgba(17, 18, 20, 0.8);
}`,
  },
  {
    title: 'Fluid typography',
    code: `
h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

p:not(:last-child) {
  margin-bottom: 1em;
}`,
  },
])
