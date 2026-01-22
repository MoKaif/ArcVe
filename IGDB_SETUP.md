# IGDB API Integration Guide

This guide will help you integrate the IGDB (Internet Game Database) API into your ArcVe game library.

## Prerequisites

You'll need:
- IGDB Client ID
- IGDB Client Secret

## Getting IGDB API Credentials

1. Go to [Twitch Developer Portal](https://dev.twitch.tv/console)
2. Log in with your Twitch account (create one if needed)
3. Click "Register Your Application"
4. Fill in the form:
   - **Name**: ArcVe (or your preferred name)
   - **OAuth Redirect URLs**: `http://localhost:3000` (for development)
   - **Category**: Choose "Application Integration" or "Website Integration"
5. Click "Create"
6. You'll receive:
   - **Client ID**: Your IGDB client ID
   - **Client Secret**: Click "New Secret" to generate

## Setting Up Environment Variables

Add your credentials as environment variables in the v0 UI:

1. Click the sidebar icon in the chat
2. Go to **Vars** section
3. Add the following variables:
   - Key: `IGDB_CLIENT_ID`, Value: `your_client_id_here`
   - Key: `IGDB_CLIENT_SECRET`, Value: `your_client_secret_here`

**Note**: These are server-side variables and should NOT have the `NEXT_PUBLIC_` prefix.

## Using the IGDB Service

The IGDB service is located at `/lib/igdb.ts`. Here are some example usage patterns:

### Search for Games

```typescript
import { searchGames } from '@/lib/igdb'

// In a Server Action or Route Handler
const results = await searchGames('Zelda', 10)
```

### Get Game Details

```typescript
import { getGameById } from '@/lib/igdb'

// Get full details for a specific game
const game = await getGameById(1234)
```

### Get Popular Games

```typescript
import { getPopularGames } from '@/lib/igdb'

const popular = await getPopularGames(20)
```

## Creating API Routes

Here's an example API route to search games:

```typescript
// app/api/games/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { searchGames } from '@/lib/igdb'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }
  
  try {
    const results = await searchGames(query)
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    )
  }
}
```

## Image Handling

IGDB provides cover art and screenshots. Use the `transformImageUrl` helper to get the right size:

```typescript
import { transformImageUrl } from '@/lib/igdb'

// Transform to different sizes
const coverBig = transformImageUrl(game.cover.url, 'cover_big')
const screenshot = transformImageUrl(game.cover.url, '720p')
const fullHD = transformImageUrl(game.cover.url, '1080p')
```

Available sizes:
- `cover_small` - 90x128
- `screenshot_med` - 569x320
- `cover_big` - 264x374
- `720p` - 1280x720
- `1080p` - 1920x1080

## Next Steps

1. Create API routes in `/app/api/` to wrap IGDB calls
2. Replace mock data in `/app/page.tsx` with real IGDB data
3. Add a search feature to find and add new games
4. Store user's game library in a database (consider using Supabase or Neon)
5. Add authentication to protect user data

## API Documentation

Full IGDB API documentation: https://api-docs.igdb.com/

## Rate Limits

IGDB/Twitch API has the following limits:
- 4 requests per second
- Tokens expire after a period (handled automatically by the service)

## Troubleshooting

**"IGDB credentials not configured"**
- Make sure you've added both `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` environment variables

**"Failed to authenticate with IGDB"**
- Check that your Client ID and Secret are correct
- Ensure you're using the correct Twitch Developer credentials

**401 Unauthorized**
- Your access token may have expired (should auto-refresh)
- Verify your credentials are correct
