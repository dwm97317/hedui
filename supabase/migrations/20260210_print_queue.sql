-- Create print_jobs table for BarTender integration
create table if not exists public.print_jobs (
    id uuid default gen_random_uuid() primary key,
    parcel_id uuid references public.parcels(id) on delete cascade,
    printer_name text,
    status text default 'pending' check (status in ('pending', 'processing', 'completed', 'error')),
    payload jsonb not null,
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.print_jobs enable row level security;

-- Drop existing policies to avoid conflicts during retry
drop policy if exists "Users can insert print jobs" on public.print_jobs;
drop policy if exists "Users can view print jobs" on public.print_jobs;

-- Simplified Policies
create policy "Users can insert print jobs"
    on public.print_jobs for insert
    with check (true);

create policy "Users can view print jobs"
    on public.print_jobs for select
    using (true);

-- Trigger for updated_at
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_print_jobs_modtime on public.print_jobs;
create trigger update_print_jobs_modtime before update on public.print_jobs for each row execute procedure update_modified_column();
