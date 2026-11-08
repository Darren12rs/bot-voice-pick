const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req,res)=> res.send('Bot VoicePick con Codigo - OK'));
app.get('/codigo', (req,res)=> res.send('Tu codigo sale en los Logs de Render'));
app.listen(PORT, ()=> console.log('Servidor en puerto '+PORT));

const PHONE = process.env.PHONE_NUMBER;
console.log('Telefono configurado:', PHONE ? 'SI, termina en ' + PHONE.slice(-4) : 'NO - Falta PHONE_NUMBER en Render');

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'voicepick-codigo' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  }
});

client.on('qr', () => console.log('Usando codigo, no QR'));
client.on('authenticated', () => console.log('Cliente autenticado, esperando listo...'));
client.on('ready', () => console.log('BOT LISTO ✅ Ya puedes mandar fotos'));
client.on('auth_failure', (m) => console.log('Fallo auth', m));
client.on('disconnected', (r) => console.log('Desconectado', r));

client.on('message', async (msg) => {
  try {
    if (msg.from === 'status@broadcast') return;
    if (!msg.hasMedia) {
      await msg.reply('Mandame solo la foto de la etiqueta 📸');
      return;
    }
    await msg.reply('Recibi tu foto, estoy leyendo... (prueba)');
  } catch(e) { console.log('Error mensaje', e.message); }
});

// Pedir codigo solo cuando ya este inicializado y sin tumbar el servidor
client.initialize().catch(e => console.log('Error initialize:', e.message));

setInterval(async () => {
  try {
    if (!PHONE) return;
    // Solo pide codigo si no esta listo aun
    const state = await client.getState().catch(()=> null);
    if (state === 'CONNECTED') return;
    console.log('Pidiendo codigo para', PHONE);
    const code = await client.requestPairingCode(PHONE);
    console.log('TU CODIGO ES: ' + code);
    console.log('Escribelo en WhatsApp > Dispositivos vinculados > Vincular con numero');
  } catch(e) {
    console.log('Aun no se puede pedir codigo, reintentando en 30s:', e.message);
  }
}, 30000);
