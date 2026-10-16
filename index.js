const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const FEED_URL = process.env.TIKTOK_RSS_URL ||
  "https://rsshub.rss3.workers.dev/tiktok/user/@kenai_redstone";
const POLL_SECONDS = Math.max(15, Number(process.env.POLL_SECONDS || 15));

if (!TOKEN || !CHANNEL_ID) {
  console.error("Falta DISCORD_TOKEN o DISCORD_CHANNEL_ID en las variables de FadeHost.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let latestSeen = null;
let busy = false;

function decodeXml(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function getItems(xml) {
  const items = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = re.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? decodeXml(m[1].trim()) : "";
    };
    const link = get("link");
    const title = get("title") || "Nuevo vídeo de TikTok";
    const guid = get("guid") || link;
    if (link && /^https?:\/\//i.test(link)) items.push({ id: guid || link, link, title });
  }
  return items;
}

async function checkFeed(initial = false) {
  if (busy) return;
  busy = true;
  try {
    const res = await fetch(FEED_URL, {
      headers: { "user-agent": "TikTokDiscordBot/1.0", "cache-control": "no-cache" },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) throw new Error(`RSS respondió HTTP ${res.status}`);
    const xml = await res.text();
    const items = getItems(xml);
    if (!items.length) throw new Error("El RSS no contiene vídeos reconocibles.");

    // El RSS suele venir del más reciente al más antiguo.
    if (latestSeen === null) {
      latestSeen = items[0].id;
      console.log(`Inicializado. Último vídeo conocido: ${items[0].link}`);
      return; // No publicar vídeos antiguos al arrancar.
    }

    const newestFirst = [];
    for (const item of items) {
      if (item.id === latestSeen) break;
      newestFirst.push(item);
    }
    if (newestFirst.length) {
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (!channel || !channel.isTextBased() || !channel.send) {
        throw new Error("No se encuentra el canal o el bot no puede enviar mensajes.");
      }
      // Publicar del más antiguo al más nuevo.
      for (const item of newestFirst.reverse()) {
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle(item.title.slice(0, 250))
          .setURL(item.link)
          .setDescription("Nuevo vídeo de TikTok de **@kenai_redstone**");
        await channel.send({ embeds: [embed] });
        console.log(`Publicado: ${item.link}`);
      }
      latestSeen = items[0].id;
    }
  } catch (err) {
    console.error("Error revisando TikTok:", err.message);
  } finally {
    busy = false;
  }
}

client.once("ready", async () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  await checkFeed(true);
  setInterval(() => checkFeed(false), POLL_SECONDS * 1000);
});

client.login(TOKEN).catch(err => {
  console.error("No se pudo iniciar sesión en Discord. Revisa DISCORD_TOKEN.", err.message);
  process.exit(1);
});
