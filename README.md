# Social Gift Registry MVP

A social gift registry platform that combines Instagram-like social features with wishlist management and budget-based recommendations.

## Features Implemented

### ✅ Core Features
- **Authentication**: Login/signup with email/password and Google OAuth
- **Social Feed**: Create posts, like posts, real-time updates
- **Registry Management**: Create, view, and manage gift registries
- **Product Management**: Add items to registries with manual entry and URL parsing
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### 🚧 Features to Implement
- **Friend System**: Add friends, send/accept friend requests
- **Budget Recommendations**: Set budgets and get product recommendations
- **Notifications**: Real-time notifications for events and updates
- **Advanced UI**: Loading states, animations, and polish

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel (ready)

## Setup Instructions

### 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `sql/schema.sql`
4. Run the SQL script to create all tables, policies, and triggers

### 2. Environment Variables

The `.env.local` file is already configured with your Supabase credentials. Make sure they match your project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bpjxudlwekkphyoicmsz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Schema

The application uses the following main tables:

- `profiles` - User profile information
- `friendships` - Friend relationships
- `posts` - Social feed posts
- `post_likes` - Post likes
- `post_comments` - Post comments
- `registries` - Gift registries
- `registry_items` - Items in registries
- `budgets` - User budgets for friends/events
- `notifications` - User notifications

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Usage

1. **Sign up** for a new account or sign in with Google
2. **Create a registry** by clicking "Create Registry" on the registry page
3. **Add items** to your registry by clicking "Add Item"
4. **Share posts** on the feed about your registries
5. **View other registries** (currently public registries only)

## Next Steps

To complete the MVP, implement:

1. **Friend System**: Add friend request functionality
2. **Budget System**: Allow users to set budgets and get recommendations
3. **Notifications**: Real-time notifications for events
4. **UI Polish**: Loading states, animations, error handling

## Deployment

The application is ready for deployment on Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

## API Endpoints

- `POST /api/products/parse-url` - Parse product information from URLs
- Authentication handled by Supabase Auth
- Database operations through Supabase client

## Contributing

This is an MVP implementation. Key areas for improvement:

- Better error handling
- More sophisticated product URL parsing
- Enhanced real-time features
- Mobile app version
- Payment integration
