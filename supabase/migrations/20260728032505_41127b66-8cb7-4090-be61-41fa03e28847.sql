select cron.unschedule('scrape-football-news-every-2-min');

alter table public.football_news
  add column if not exists subtitle text,
  add column if not exists is_featured boolean not null default false;

grant select on public.football_news to anon, authenticated;
grant insert, update, delete on public.football_news to authenticated;
grant all on public.football_news to service_role;

drop policy if exists "Staff can manage football news" on public.football_news;
create policy "Staff can manage football news"
on public.football_news for all to authenticated
using (
  public.has_role(auth.uid(), 'admin') or
  public.has_role(auth.uid(), 'developer') or
  public.has_role(auth.uid(), 'marketing')
)
with check (
  public.has_role(auth.uid(), 'admin') or
  public.has_role(auth.uid(), 'developer') or
  public.has_role(auth.uid(), 'marketing')
);