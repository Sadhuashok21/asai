# asai

React + Vite + Tailwind CSS project for ASAI (All-in-one AI assistant).

## Development Server

To run the development server:
`npm run dev`

## Project Structure

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and `@` alias for `src`
