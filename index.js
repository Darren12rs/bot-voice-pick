const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req,res)=> res.send('Bot VoicePick con Codigo'));
app.get('/codigo', (req,res)=> res.send('Tu codigo sale en los Logs de Render'));
app.listen(PORT, ()=> console.log('Servidor en puerto '+PORT));

const PHONE = process.env.PHONE_NUMBER;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'voicepick-codigo' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  }
});

client.on('qr', (qr) => {
  console.log('Usando codigo, no QR');
});

client.on('authenticated', () => console.log('Cliente autenticado, esperando listo...'));
client.on('ready', () => console.log('BOT LISTO ✅ Ya puedes mandar fotos'));

client.on('auth_failure', (m) => console.log('Fallo auth', m));

client.on('message', async (msg) => {
  try {
    if (msg.from === 'status@broadcast') return;
    if (!msg.hasMedia) {
      await msg.reply('Mandame solo la foto de la etiqueta 📸');
      return;
    }
    const media = await msg.downloadMedia();
    await msg.reply('Recibi tu foto, estoy leyendo... (prueba)');
  } catch(e) { console.log('Error mensaje', e); }
});

client.initialize().then(async () => {
  // Si no esta autenticado, pide codigo
  setTimeout(async () => {
    try {
      const code = await client.requestPairingCode(PHONE);
      console.log('TU CODIGO ES: ' + code);
      console.log('Escribelo en WhatsApp > Dispositivos vinculados > Vincular con numero de telefono');
    } catch(e) { console.log('No se pudo pedir codigo, ya esta vinculado?', e.message); }
  }, 5000);
});
