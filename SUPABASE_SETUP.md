# Supabase Setup Guide

## 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `sql/schema.sql`
4. Run the SQL script to create all tables, policies, and triggers

## 2. Enable Google OAuth (Optional)

To enable Google OAuth login:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
5. Add your site URL to the redirect URLs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

## 3. Email Settings (Optional)

To enable email confirmations:

1. Go to Authentication > Settings
2. Configure email templates
3. Set up SMTP settings for custom email provider

## 4. Test the Application

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Sign up for a new account
4. Check your email for confirmation (if email is configured)
5. Sign in and test the features

## Current Status

✅ **Working Features:**
- Email/password authentication
- Registry creation and management
- Social feed with posts and likes
- Product management
- Real-time updates

🚧 **Features requiring additional setup:**
- Google OAuth (needs provider configuration)
- Email confirmations (needs SMTP setup)

## Troubleshooting

### "Unsupported provider" error
- Google OAuth is not enabled in your Supabase project
- Enable it in Authentication > Providers

### Database errors
- Make sure you've run the SQL schema script
- Check that RLS policies are properly configured

### Authentication issues
- Verify your Supabase URL and anon key in `.env.local`
- Check that the database schema is properly set up
