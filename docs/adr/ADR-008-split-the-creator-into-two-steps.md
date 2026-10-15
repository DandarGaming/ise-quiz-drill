# ADR-008: Split the Test Creator into Two Steps

## Status: Accepted (Date: 2026-10-15)

## Context

The creator showed the test settings first, then the prompt builder and the
JSON import. The title was required even though the JSON already has one, and
someone who only wanted to reuse a JSON file had to scroll past the prompt
builder to reach the import box.

Layouts considered: a stepper, two numbered cards, tabs, and a switch at the
top that picks the path.

## Decision

- Step 1 "Create test content": prompt options, compiled prompt, copy. No title
  or settings.
- Step 2 "Import & settings": JSON paste or drop, then title, time limit,
  layout, anti-cheat, then Start at the bottom.
- A switch at the top ("Write new questions with AI" / "I already have JSON")
  opens either step, so JSON users go straight to step 2. Step 1 has a Next
  button.
- Only one step is on screen. The options, settings, built prompt and JSON text
  stay in MockTestCreator, so moving between steps loses nothing and a preset
  can set the options and settings from step 1.
- The title field is optional. Empty means the title from the JSON; a title
  typed by the user wins.

## Consequences

- JsonImporter no longer has a Start button or parses by itself; the creator
  parses once and passes the result down.
- Start is always visible in step 2, disabled with a short reason until the
  JSON is valid.
- Title is no longer validated: a valid JSON always has one.
