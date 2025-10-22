-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    UNIQUE(requester_id, addressee_id)
);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL
);

-- Create registries table
CREATE TABLE IF NOT EXISTS public.registries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE,
    access_level TEXT DEFAULT 'friends' CHECK (access_level IN ('public', 'friends', 'private')),
    description TEXT
);

-- Create registry_items table
CREATE TABLE IF NOT EXISTS public.registry_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registry_id UUID REFERENCES public.registries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    url TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'purchased')),
    purchased_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    registry_id UUID REFERENCES public.registries(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    UNIQUE(user_id, friend_id, registry_id)
);

-- Create registry_item_comments table
CREATE TABLE IF NOT EXISTS public.registry_item_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    item_id UUID REFERENCES public.registry_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL
);

-- Enable Row Level Security for registry_item_comments
ALTER TABLE public.registry_item_comments ENABLE ROW LEVEL SECURITY;

-- Registry item comments policies
CREATE POLICY "Users can view comments on visible registry items" ON public.registry_item_comments
    FOR SELECT USING (
        item_id IN (
            SELECT ri.id FROM public.registry_items ri
            JOIN public.registries r ON ri.registry_id = r.id
            WHERE 
            r.access_level = 'public' OR
            (r.access_level = 'friends' AND (
                r.user_id = auth.uid() OR 
                r.user_id IN (
                    SELECT addressee_id FROM public.friendships 
                    WHERE requester_id = auth.uid() AND status = 'accepted'
                    UNION
                    SELECT requester_id FROM public.friendships 
                    WHERE addressee_id = auth.uid() AND status = 'accepted'
                )
            )) OR
            r.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments on visible registry items" ON public.registry_item_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        item_id IN (
            SELECT ri.id FROM public.registry_items ri
            JOIN public.registries r ON ri.registry_id = r.id
            WHERE 
            r.access_level = 'public' OR
            (r.access_level = 'friends' AND (
                r.user_id = auth.uid() OR 
                r.user_id IN (
                    SELECT addressee_id FROM public.friendships 
                    WHERE requester_id = auth.uid() AND status = 'accepted'
                    UNION
                    SELECT requester_id FROM public.friendships 
                    WHERE addressee_id = auth.uid() AND status = 'accepted'
                )
            )) OR
            r.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own comments" ON public.registry_item_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.registry_item_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on registry_item_comments
CREATE TRIGGER update_registry_item_comments_updated_at BEFORE UPDATE ON public.registry_item_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON public.friendships
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests" ON public.friendships
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own friend requests" ON public.friendships
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Posts policies
CREATE POLICY "Users can view posts from friends" ON public.posts
    FOR SELECT USING (
        user_id = auth.uid() OR 
        user_id IN (
            SELECT addressee_id FROM public.friendships 
            WHERE requester_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT requester_id FROM public.friendships 
            WHERE addressee_id = auth.uid() AND status = 'accepted'
        )
    );

CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Users can view likes on visible posts" ON public.post_likes
    FOR SELECT USING (
        post_id IN (
            SELECT id FROM public.posts WHERE 
            user_id = auth.uid() OR 
            user_id IN (
                SELECT addressee_id FROM public.friendships 
                WHERE requester_id = auth.uid() AND status = 'accepted'
                UNION
                SELECT requester_id FROM public.friendships 
                WHERE addressee_id = auth.uid() AND status = 'accepted'
            )
        )
    );

CREATE POLICY "Users can like posts" ON public.post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes" ON public.post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Users can view comments on visible posts" ON public.post_comments
    FOR SELECT USING (
        post_id IN (
            SELECT id FROM public.posts WHERE 
            user_id = auth.uid() OR 
            user_id IN (
                SELECT addressee_id FROM public.friendships 
                WHERE requester_id = auth.uid() AND status = 'accepted'
                UNION
                SELECT requester_id FROM public.friendships 
                WHERE addressee_id = auth.uid() AND status = 'accepted'
            )
        )
    );

CREATE POLICY "Users can create comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.post_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Registries policies
CREATE POLICY "Users can view public registries" ON public.registries
    FOR SELECT USING (access_level = 'public');

CREATE POLICY "Users can view friends' registries" ON public.registries
    FOR SELECT USING (
        access_level = 'friends' AND (
            user_id = auth.uid() OR 
            user_id IN (
                SELECT addressee_id FROM public.friendships 
                WHERE requester_id = auth.uid() AND status = 'accepted'
                UNION
                SELECT requester_id FROM public.friendships 
                WHERE addressee_id = auth.uid() AND status = 'accepted'
            )
        )
    );

CREATE POLICY "Users can view own registries" ON public.registries
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create registries" ON public.registries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registries" ON public.registries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own registries" ON public.registries
    FOR DELETE USING (auth.uid() = user_id);

-- Registry items policies
CREATE POLICY "Users can view items from visible registries" ON public.registry_items
    FOR SELECT USING (
        registry_id IN (
            SELECT id FROM public.registries WHERE 
            access_level = 'public' OR
            (access_level = 'friends' AND (
                user_id = auth.uid() OR 
                user_id IN (
                    SELECT addressee_id FROM public.friendships 
                    WHERE requester_id = auth.uid() AND status = 'accepted'
                    UNION
                    SELECT requester_id FROM public.friendships 
                    WHERE addressee_id = auth.uid() AND status = 'accepted'
                )
            )) OR
            user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create items in own registries" ON public.registry_items
    FOR INSERT WITH CHECK (
        registry_id IN (
            SELECT id FROM public.registries WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in own registries" ON public.registry_items
    FOR UPDATE USING (
        registry_id IN (
            SELECT id FROM public.registries WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items from own registries" ON public.registry_items
    FOR DELETE USING (
        registry_id IN (
            SELECT id FROM public.registries WHERE user_id = auth.uid()
        )
    );

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create budgets" ON public.budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON public.budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON public.budgets
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registries_updated_at BEFORE UPDATE ON public.registries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registry_items_updated_at BEFORE UPDATE ON public.registry_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notification trigger functions
CREATE OR REPLACE FUNCTION public.trigger_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, content, metadata)
    VALUES (
        NEW.addressee_id,
        'friend_request',
        'You have a new friend request',
        jsonb_build_object(
            'requester_id', NEW.requester_id,
            'friendship_id', NEW.id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_registry_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    registry_owner_id UUID;
    item_title TEXT;
BEGIN
    -- Get registry owner and item title
    SELECT r.user_id, ri.title INTO registry_owner_id, item_title
    FROM public.registries r
    JOIN public.registry_items ri ON r.id = ri.registry_id
    WHERE ri.id = NEW.id;
    
    -- Only notify if status changed to purchased
    IF OLD.status != 'purchased' AND NEW.status = 'purchased' THEN
        INSERT INTO public.notifications (user_id, type, content, metadata)
        VALUES (
            registry_owner_id,
            'registry_update',
            'Someone purchased "' || item_title || '" from your registry',
            jsonb_build_object(
                'item_id', NEW.id,
                'registry_id', NEW.registry_id,
                'purchased_by', NEW.purchased_by
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
    commenter_name TEXT;
BEGIN
    -- Get post owner
    SELECT user_id INTO post_owner_id
    FROM public.posts
    WHERE id = NEW.post_id;
    
    -- Get commenter name
    SELECT display_name INTO commenter_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Don't notify if commenting on own post
    IF post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, content, metadata)
        VALUES (
            post_owner_id,
            'registry_update',
            COALESCE(commenter_name, 'Someone') || ' commented on your post',
            jsonb_build_object(
                'comment_id', NEW.id,
                'post_id', NEW.post_id,
                'commenter_id', NEW.user_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_friend_request_created
    AFTER INSERT ON public.friendships
    FOR EACH ROW EXECUTE FUNCTION public.trigger_friend_request_notification();

CREATE TRIGGER on_registry_item_updated
    AFTER UPDATE ON public.registry_items
    FOR EACH ROW EXECUTE FUNCTION public.trigger_registry_update_notification();

CREATE TRIGGER on_comment_created
    AFTER INSERT ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION public.trigger_comment_notification();
