-- Per-ticket guest name (buyer can name each ticket when buying for friends)
alter table awp_tickets add column if not exists guest_name text;
