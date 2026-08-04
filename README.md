# Game library dashboard

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/noxfreak4-6418s-projects/v0-arc-ve)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/eygNS28wDDd)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Features

- **Library Dashboard** - Browse your game collection at a glance
- **Game Detail Page** - View detailed info for a game, with animations and navigation back to the library
- **Search & Add Game** - Search IGDB for games and add them to your library

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

Other available commands:

```bash
pnpm build   # production build
pnpm start   # run the production build
pnpm lint    # lint the project
```

This project integrates with the IGDB API for game data, which requires a couple of environment variables to be configured. See [IGDB_SETUP.md](./IGDB_SETUP.md) for setup instructions.

## Deployment

Your project is live at:

**[https://vercel.com/noxfreak4-6418s-projects/v0-arc-ve](https://vercel.com/noxfreak4-6418s-projects/v0-arc-ve)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/eygNS28wDDd](https://v0.app/chat/eygNS28wDDd)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository