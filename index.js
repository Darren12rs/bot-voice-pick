const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let ultimoQR = null;

app.get('/', (req, res) => {
  res.send('<h1>Bot VoicePick esta vivo ✅</h1><p>Ve a <a href="/qr">/qr</a> para escanear el QR</p>');
});

app.get('/qr', (req, res) => {
  if (!ultimoQR) {
    return res.send('<h2>⏳ Esperando QR... Recarga en 10 segundos</h2><script>setTimeout(()=>location.reload(), 5000)</script>');
  }
  res.send(`<h2>Escanea este QR con WhatsApp</h2><img src="${ultimoQR}" style="width:300px;height:300px"><p>Si no carga, recarga la pagina</p><script>setTimeout(()=>location.reload(), 20000)</script>`);
});

app.listen(PORT, () => console.log('Servidor en puerto ' + PORT));

const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const axios = require('axios');
const FormData = require('form-data');

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'voicepick2' }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  }
});

client.on('qr', async (qr) => {
  console.log('Nuevo QR generado, ve a /qr');
  ultimoQR = await QRCode.toDataURL(qr);
});

client.on('ready', () => {
  console.log('BOT LISTO ✅ Ya puedes mandar fotos');
  ultimoQR = null;
});

client.on('message', async (msg) => {
  if (msg.hasMedia) {
    const media = await msg.downloadMedia();
    const datos = await leerEtiqueta(media.data);
    const esCorrecto = validarVoicePick(datos.gtin, datos.lot, datos.fecha, datos.voicePick);
    msg.reply(esCorrecto ? "CORRECTO ✅" : "INCORRECTO ❌");
  } else {
    msg.reply("Mandame solo la foto de la etiqueta 📸");
  }
});

async function leerEtiqueta(base64) {
  const form = new FormData();
  form.append('base64Image', 'data:image/jpeg;base64,' + base64);
  form.append('OCREngine', '2');
  const res = await axios.post('https://api.ocr.space/parse/image?apikey=helloworld', form, { headers: form.getHeaders() });
  const texto = res.data.ParsedResults?.[0]?.ParsedText || "";
  const gtin = (texto.match(/\b\d{14}\b/) || [""])[0];
  const lot = (texto.match(/PSU\d+/i) || [""])[0].toUpperCase();
  const fecha = (texto.match(/\b\d{6}\b/) || [""])[0];
  const voice = texto.match(/(\d{2})\s+(\d{2})/);
  const voicePick = voice ? voice[1] + voice[2] : "";
  return { gtin, lot, fecha, voicePick };
}

function validarVoicePick(gtin, lot, fecha, voicePickImpreso) {
  if (gtin === "00881006003406") return voicePickImpreso === "4970";
  if (gtin === "17750497660422") return voicePickImpreso === "9231";
  return false;
}

client.initialize();
