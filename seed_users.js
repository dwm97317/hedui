import { createClient } from '@supabase/supabase-js';

// Setup Admin Client (Needs SERVICE_ROLE_KEY if we want to bypass email confirm or delete users)
// But for now let's try standard signUp. Wait, standard signUp requires email confirm often.
// If run on server, we can use Service Role to auto-confirm.

// Since I don't have the SERVICE_ROLE_KEY handy (usually sensitive), I'll try standard signUp.
// If confirming is required, I'll fail. 
// BUT, often locally or dev projects disable email confirm.

// User provided VITE_SUPABASE_URL and ANON_KEY.
const url = process.env.VITE_SUPABASE_URL || 'https://zpxasdfhrwpxdswywrmr.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweGFzZGZocndweGRzd3l3cm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjQyNzIsImV4cCI6MjA4NjE0MDI3Mn0.zMalp1qNzeLKoUXAKwFnkrmn2awrYoQ7kgj-LPh39I4';

const supabase = createClient(url, key);

async function registerUser(email, password, role, companyCode) {
    console.log(`Creating user: ${email}...`);

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        if (error.message.includes('already registered')) {
            console.log(`User ${email} already exists. Skipping registration.`);
            const { data: { user } } = await supabase.auth.signInWithPassword({ email, password });
            if (user) await linkProfile(user.id, role, companyCode);
            return;
        }
        console.error(`Failed to create ${email}:`, error.message);
        return;
    }

    const user = data.user;
    if (user) {
        console.log(`User created: ${user.id}`);
        await linkProfile(user.id, role, companyCode);
    }
}

async function linkProfile(userId, role, companyCode) {
    // 2. Find Company
    const { data: company } = await supabase.from('companies').select('id').eq('code', companyCode).single();

    if (!company) {
        console.error(`Company ${companyCode} not found!`);
        return;
    }

    // 3. Create/Update Profile
    const { error } = await supabase.from('profiles').upsert({
        id: userId,
        company_id: company.id,
        role: role,
        full_name: `Test ${role} User`,
        is_active: true
    });

    if (error) {
        console.error(`Failed to link profile for ${userId}:`, error.message);
    } else {
        console.log(`✅ Profile linked for ${role} user.`);
    }
}

async function main() {
    await registerUser('sender_v2@test.com', 'password', 'sender', 'SENDER_001');
    await registerUser('transit_v2@test.com', 'password', 'transit', 'TRANSIT_001');
    await registerUser('receiver_v2@test.com', 'password', 'receiver', 'RECEIVER_001');
}

main();
