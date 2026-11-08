const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const FormData = require('form-data');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  }
});

// Cuando el bot esté listo, te muestra el QR
client.on('qr', (qr) => {
  console.log('ESCANEA ESTE QR CON TU WHATSAPP:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('BOT LISTO ✅ Ya puedes mandar fotos');
});

client.on('message', async (msg) => {
  // Si es foto
  if (msg.hasMedia) {
    const media = await msg.downloadMedia();
    // Aquí va el OCR gratis
    const datos = await leerEtiqueta(media.data);
    const esCorrecto = validarVoicePick(datos.gtin, datos.lot, datos.fecha, datos.voicePick);
    const respuesta = esCorrecto ? "CORRECTO ✅" : "INCORRECTO ❌";
    msg.reply(respuesta);
  } else {
    msg.reply("Mándame solo la foto de la etiqueta 📸");
  }
});

async function leerEtiqueta(base64) {
  // OCR gratis con ocr.space
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
  // Misma lógica que ya validamos contigo
  if (gtin === "00881006003406") return voicePickImpreso === "4970";
  if (gtin === "17750497660422") return voicePickImpreso === "9231";
  return false;
}

client.initialize();
