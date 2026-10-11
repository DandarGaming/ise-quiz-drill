# ADR-004: Load Tailwind Through PostCSS, Scoped to Quiz Pages

## Status: Accepted (Date: 2026-10-11)

## Context

ADR-003 chose Tailwind CSS for the quiz UI. The official integration,
@astrojs/tailwind, is deprecated and only supports Astro up to version 5, so
npm refuses to install it next to Astro 7. Tailwind's base layer (preflight)
also resets browser defaults: headings lose their sizes, lists lose their
bullets and margins drop to zero. The blog pages rely on those defaults, and
the blog stays in the app until it is removed in its own change.

## Decision

- Run Tailwind 3 as a PostCSS plugin (postcss.config.mjs). Vite already
  passes every stylesheet through PostCSS, so no Astro integration is needed.
- Put the Tailwind directives in src/styles/quiz.css and import that file
  only from quiz pages. Astro bundles CSS per page, so blog pages never
  receive the reset.
- Keep tailwindcss and autoprefixer in devDependencies. They only run at
  build time, so the runtime image does not grow.

## Consequences

- Positive: blog output is unchanged. Built HTML for /, /blog, /about and
  the posts was byte-identical before and after the change.
- Positive: no deprecated package and no forced peer dependency install.
- Negative: every quiz page has to import quiz.css itself. Importing it from
  a shared or blog layout would break the blog styles.
- Negative: upgrading to Tailwind 4 later means switching to its Vite plugin
  and rewriting the config.
