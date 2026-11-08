const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;
const PHONE = (process.env.PHONE_NUMBER || '').replace(/\D/g, '');

app.get('/', (req, res) => res.send('Bot VoicePick - OK'));
app.listen(PORT, () => console.log('Servidor en puerto ' + PORT));

console.log('Telefono configurado:', PHONE ? 'SI, termina en ' + PHONE.slice(-4) : 'NO - Falta PHONE_NUMBER');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'voicepick-codigo',
    dataPath: process.env.SESSION_PATH || './.wwebjs_auth', // apúntalo al disco persistente
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  },
});

let codigoSolicitado = false;

client.on('qr', async () => {
  // Solo se pide UNA vez; si ya se pidió, ignoramos los QR siguientes
  if (codigoSolicitado || !PHONE) return;
  codigoSolicitado = true;
  try {
    const code = await client.requestPairingCode(PHONE);
    console.log('TU CODIGO ES: ' + code);
    console.log('WhatsApp > Dispositivos vinculados > Vincular con numero de telefono');
  } catch (e) {
    codigoSolicitado = false; // permite reintentar en el próximo evento qr
    console.log('Error pidiendo codigo:', e.message);
  }
});

client.on('authenticated', () => console.log('Cliente autenticado'));
client.on('ready', () => console.log('BOT LISTO ✅'));
client.on('auth_failure', (m) => console.log('Fallo auth', m));
client.on('disconnected', (r) => {
  console.log('Desconectado', r);
  process.exit(1); // Render reinicia el servicio limpio
});

client.on('message', async (msg) => {
  try {
    if (msg.from === 'status@broadcast') return;
    if (!msg.hasMedia) {
      await msg.reply('Mandame solo la foto de la etiqueta 📸');
      return;
    }
    // const media = await msg.downloadMedia(); // aquí procesas la foto
    await msg.reply('Recibi tu foto, estoy leyendo... (prueba)');
  } catch (e) {
    console.log('Error mensaje', e.message);
  }
});

client.initialize().catch((e) => console.log('Error initialize:', e.message));
