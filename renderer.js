const $ = id => document.getElementById(id);
const micButton = $("micButton"), commandForm = $("commandForm"), commandInput = $("commandInput");
const statusText = $("statusText"), mainMessage = $("mainMessage"), subMessage = $("subMessage");
const micCaption = $("micCaption"), actionPanel = $("actionPanel"), settingsPanel = $("settingsPanel");
let recognition = null, listening = false, voiceEnabled = true, language = "es-ES";
function setStatus(value) { statusText.textContent = value; }
function speak(text) {
  if (!voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language; utterance.rate = 1; window.speechSynthesis.speak(utterance);
}
function respond(text, options = {}) {
  document.body.classList.remove("thinking", "listening");
  mainMessage.textContent = text; subMessage.textContent = options.subtitle || "¿Qué más necesitas?";
  setStatus("SISTEMA PREPARADO"); micCaption.textContent = "PULSA PARA HABLAR"; speak(text);
}
function showPanel(title, html) {
  $("panelTitle").textContent = title; $("panelContent").innerHTML = html; actionPanel.classList.remove("hidden");
}
function closePanels() { actionPanel.classList.add("hidden"); settingsPanel.classList.add("hidden"); }
const sites = {
  youtube:["YouTube","https://www.youtube.com"], google:["Google","https://www.google.com"],
  instagram:["Instagram","https://www.instagram.com"], tiktok:["TikTok","https://www.tiktok.com"],
  spotify:["Spotify","https://open.spotify.com"], gmail:["Gmail","https://mail.google.com"],
  github:["GitHub","https://github.com"], discord:["Discord","https://discord.com/app"]
};
async function runCommand(raw) {
  const text = raw.trim(); if (!text) return;
  commandInput.value = ""; document.body.classList.add("thinking"); setStatus("PROCESANDO");
  mainMessage.textContent = "Un momento...";
  const normalized = text.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/que puedes hacer|ayuda|comandos|funciones/.test(normalized)) {
    showPanel("Lo que puedo hacer", `
      <div class="action-item"><strong>Abrir servicios</strong><small>YouTube, Spotify, Instagram, TikTok, Gmail, GitHub y Discord.</small></div>
      <div class="action-item"><strong>Abrir aplicaciones del ordenador</strong><small>Calculadora y Notas en las plataformas compatibles.</small></div>
      <div class="action-item"><strong>Hablar contigo</strong><small>Reconocimiento de voz y respuestas habladas si tu sistema lo admite.</small></div>
      <div class="action-item"><strong>Conexiones avanzadas</strong><small>Las estadísticas privadas y el análisis de contenido necesitan conectar servicios autorizados y configurar sus APIs.</small></div>`);
    respond("Puedo abrir servicios compatibles, lanzar algunas aplicaciones y conversar contigo por voz."); return;
  }
  const siteKey = Object.keys(sites).find(key => normalized.includes(key) && /(abre|abrir|entra|ve a|ir a|inicia)/.test(normalized));
  if (siteKey) {
    const [name,url] = sites[siteKey]; const result = await window.neurix.openUrl(url);
    respond(result.ok ? `Abriendo ${name}.` : result.error);
    showPanel("Abriendo servicio", `<div class="action-item"><strong>${name}</strong><small>Se abrirá en tu navegador predeterminado.</small><button class="action-link" id="openAgain">Abrir de nuevo</button></div>`);
    $("openAgain").addEventListener("click", () => window.neurix.openUrl(url)); return;
  }
  const appMatch = normalized.match(/(?:abre|abrir|inicia|ejecuta) (calculadora|notas)/);
  if (appMatch) {
    const id = appMatch[1] === "calculadora" ? "calculator" : "notes";
    const result = await window.neurix.openApp(id); respond(result.ok ? `Abriendo ${appMatch[1]}.` : result.error); return;
  }
  if (/analiza|analizar/.test(normalized) && /video/.test(normalized)) {
    showPanel("Análisis de vídeo", `
      <div class="action-item"><strong>Función en preparación</strong><small>Para analizar un vídeo de verdad hace falta un servicio de IA y que autorices el acceso al archivo. Esta versión no sube ni analiza vídeos por su cuenta.</small></div>
      <div class="action-item"><strong>Privacidad</strong><small>No introduzcas contraseñas ni claves API en el chat de voz.</small></div>`);
    respond("Puedo preparar el flujo de análisis, pero todavía no tengo conectado un motor de vídeo."); return;
  }
  if (/conecta|conectar|vincula|vincular/.test(normalized)) {
    showPanel("Conexión de servicios", `
      <div class="action-item"><strong>Servicios web</strong><small>Puedo abrir los sitios de YouTube, TikTok, Instagram, Spotify, Discord y GitHub. Abrirlos no significa que la cuenta esté conectada.</small></div>
      <div class="action-item"><strong>Integraciones privadas</strong><small>Para leer estadísticas o gestionar una cuenta se necesita una autorización oficial del servicio (OAuth/API).</small></div>`);
    respond("Puedo abrir el servicio que quieras. Para conectar una cuenta y consultar sus datos necesitamos su autorización oficial."); return;
  }
  if (/hola|buenas|hey|que tal/.test(normalized)) { respond("Hola. Estoy preparado. ¿Qué hacemos?"); return; }
  respond("Todavía no tengo una respuesta para esa orden.", {subtitle:"Prueba: «abre YouTube», «abre Calculadora» o «qué puedes hacer»."});
}
function startRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { respond("El reconocimiento de voz no está disponible en esta versión. Puedes escribirme abajo."); return; }
  if (listening && recognition) { recognition.stop(); return; }
  recognition = new SpeechRecognition(); recognition.lang = language;
  recognition.interimResults = false; recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    listening = true; document.body.classList.add("listening"); setStatus("ESCUCHANDO");
    micCaption.textContent = "TE ESCUCHO..."; mainMessage.textContent = "Te escucho"; subMessage.textContent = "Habla con claridad.";
  };
  recognition.onresult = event => runCommand(event.results[0][0].transcript);
  recognition.onerror = event => respond(event.error === "not-allowed" ? "Necesito permiso para usar el micrófono." : "No he podido entenderte. Inténtalo otra vez.");
  recognition.onend = () => {
    listening = false; document.body.classList.remove("listening"); micCaption.textContent = "PULSA PARA HABLAR";
    if (statusText.textContent === "ESCUCHANDO") setStatus("SISTEMA PREPARADO");
  };
  try { recognition.start(); } catch { respond("No he podido iniciar el micrófono. Prueba de nuevo."); }
}
micButton.addEventListener("click", startRecognition);
commandForm.addEventListener("submit", event => { event.preventDefault(); runCommand(commandInput.value); });
document.querySelectorAll("[data-command]").forEach(button => button.addEventListener("click", () => runCommand(button.dataset.command)));
$("settingsButton").addEventListener("click", () => { closePanels(); settingsPanel.classList.remove("hidden"); });
$("closeSettings").addEventListener("click", closePanels);
$("closePanel").addEventListener("click", () => actionPanel.classList.add("hidden"));
$("voiceToggle").addEventListener("change", event => { voiceEnabled = event.target.checked; });
$("languageSelect").addEventListener("change", event => { language = event.target.value; });
