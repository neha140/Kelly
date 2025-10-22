# Database Setup Guide

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Sign in to your account
- Click on your project: `bpjxudlwekkphyoicmsz`

### 2. Open SQL Editor
- In the left sidebar, click **"SQL Editor"**
- Click **"New Query"** to create a new SQL script

### 3. Copy and Paste the Schema
Copy the entire SQL script from the terminal output above and paste it into the SQL Editor.

### 4. Run the Script
- Click the **"Run"** button (or press Ctrl+Enter)
- Wait for all commands to execute successfully
- You should see "Success" messages

### 5. Verify Tables Were Created
- Go to **"Table Editor"** in the left sidebar
- You should see these tables:
  - profiles
  - friendships
  - posts
  - post_likes
  - post_comments
  - registries
  - registry_items
  - budgets
  - notifications

### 6. Test Your App
- Go back to your app: http://localhost:3001
- Try signing up with a real email (like yourname@gmail.com)
- Try signing in

## What This Script Does

1. **Creates all necessary tables** for the social gift registry
2. **Sets up Row Level Security (RLS)** to protect user data
3. **Creates policies** to control who can access what data
4. **Sets up triggers** to automatically create user profiles
5. **Enables real-time features** for the social feed

## Troubleshooting

### If you get errors:
- Make sure you're copying the ENTIRE script
- Don't modify any of the SQL commands
- Run the script in one go (don't split it)

### If tables don't appear:
- Check the SQL Editor for any error messages
- Make sure all commands executed successfully
- Try refreshing the Table Editor page

### If authentication still doesn't work:
- Make sure you're using a real email format (like yourname@gmail.com)
- Check that the profiles table was created
- Try signing up first, then signing in
