-- Orun OS - WhatsApp voice integration (0014_whatsapp_voice.sql)
--
-- Adds channel metadata to conversations/messages so the WhatsApp Baileys
-- gateway and the mobile voice assistant can exchange messages with
-- direction-aware Realtime (aviso por voz + responder por voz).

-- conversations: which channel owns the external thread
alter table conversations add column if not exists channel_id text not null default 'dm'
  check (channel_id in ('dm', 'whatsapp', 'telegram'));
alter table conversations add column if not exists external_conversation_id text;

create index if not exists idx_conversations_external
  on conversations (external_conversation_id, channel_id)
  where external_conversation_id is not null;

-- messages: direction + external ids so Realtime can distinguish
-- gateway-delivered messages (inbound) from app-generated replies (outbound).
alter table messages add column if not exists direction text
  check (direction in ('inbound', 'outbound'));
alter table messages add column if not exists external_message_id text;
alter table messages add column if not exists type text not null default 'text';
alter table messages add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_messages_direction
  on messages (conversation_id, direction, seq);
