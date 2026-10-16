# TikTok → Discord

Publica enlaces nuevos del RSS de TikTok en un canal de Discord.

## Variables de entorno en FadeHost

- `DISCORD_TOKEN`: token del bot de Discord (no lo subas a GitHub).
- `DISCORD_CHANNEL_ID`: ID numérico del canal de Discord donde publicar.
- `TIKTOK_RSS_URL`: opcional; por defecto usa el RSS de @kenai_redstone.
- `POLL_SECONDS`: opcional; por defecto 15, mínimo 15.

El bot recuerda en memoria el último vídeo visto y no publica el historial al arrancar.
El alojamiento o el RSS pueden introducir retrasos; consultar cada 15 segundos no garantiza que TikTok/RSS actualice en ese tiempo.

## Permisos del bot

Invita el bot al servidor con `View Channels`, `Send Messages` y `Embed Links`.
