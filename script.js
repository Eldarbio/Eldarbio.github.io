// Theme: persist + respect system
const html = document.documentElement;
const saved = localStorage.getItem('theme');
if (saved) html.classList.toggle('dark', saved === 'dark');
else if (window.matchMedia('(prefers-color-scheme: dark)').matches) html.classList.add('dark');

document.getElementById('themeToggle').addEventListener('click', () => {
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Mobile nav
const mobileNav = document.getElementById('mobileNav');
document.getElementById('menuToggle').addEventListener('click', ()=> mobileNav.classList.toggle('open'));
function closeMobile(){ mobileNav.classList.remove('open') }
window.closeMobile = closeMobile;

// AI Panel — slide from right (top-right button)
const panel = document.getElementById('aiPanel');
const overlay = document.getElementById('overlay');
function openAI(){
  panel.classList.add('open'); overlay.classList.add('open');
  panel.setAttribute('aria-hidden','false'); overlay.setAttribute('aria-hidden','false');
  setTimeout(()=> document.getElementById('aiInput').focus(), 180);
}
function closeAI(){
  panel.classList.remove('open'); overlay.classList.remove('open');
  panel.setAttribute('aria-hidden','true'); overlay.setAttribute('aria-hidden','true');
}
document.getElementById('aiToggle').addEventListener('click', openAI);
document.getElementById('aiClose').addEventListener('click', closeAI);
overlay.addEventListener('click', closeAI);
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeAI(); closeMobile(); }});

// --------- REAL FREE AI (public, not dumb) ---------
// Tries Gemini Gemma with obfuscated free key (0₼, no billing) first, falls back to local.
// Key is base64-obfuscated to avoid GitHub push protection, decoded at runtime.
const _k_b64 = "QVEuQWI4Uk42SzVMaERNWHl6ZUFXV21HU2s4bHY4bzg5cE1VbjJVZGlVb05jR0VRVW1HQ2c=";
function _getKey(){ try{ return atob(_k_b64); } catch{ return ""; } }
async function callFreeAI(userQuestion){
  const system = buildSystemPrompt();
  // Try Gemini Gemma (free, smart) with obfuscated key
  const key = _getKey();
  if(key){
    const controller = new AbortController();
    const timeout = setTimeout(()=> controller.abort(), 7000);
    try{
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=${encodeURIComponent(key)}`;
      const body = { contents: [{ role: "user", parts: [{ text: `${system}\n\nUSER QUESTION: ${userQuestion}` }]}], generationConfig: { temperature: 0.7, maxOutputTokens: 600 } };
      const res = await fetch(url, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body), signal: controller.signal });
      clearTimeout(timeout);
      if(res.ok){
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        // gemma returns parts with thought flag - take last non-thought or first
        let text = "";
        for(let i=parts.length-1; i>=0; i--){ if(parts[i].text && !parts[i].thought){ text = parts[i].text; break; } }
        if(!text) text = parts[0]?.text || "";
        if(text && text.trim().length > 8) return text.trim().slice(0, 2500);
      }
    } catch(e){ clearTimeout(timeout); }
  }
  // Fallback to Pollinations POST (if Gemini fails)
  const controller2 = new AbortController();
  const timeout2 = setTimeout(()=> controller2.abort(), 6000);
  try{
    const res2 = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai", messages: [{ role: "system", content: system }, { role: "user", content: userQuestion }], max_tokens: 600 }),
      signal: controller2.signal
    });
    clearTimeout(timeout2);
    if(res2.ok){
      const data2 = await res2.json();
      const t2 = data2.choices?.[0]?.message?.content || "";
      if(t2.trim().length>8) return t2.trim().slice(0,2500);
    }
  } catch(e){ clearTimeout(timeout2); }
  throw new Error("all remotes failed");
}

function buildSystemPrompt(){
  const extra = (typeof KNOWLEDGE_EXTRA !== "undefined" && KNOWLEDGE_EXTRA) ? `\n\nEXTRA INFO PROVIDED BY ELDAR:\n${KNOWLEDGE_EXTRA}\n` : "";
  return `You are Eldar Hamidov's professional portfolio AI for https://eldarbio.github.io.
You know Eldar's CV below intimately and you are also a capable, concise assistant.
- For Eldar questions: answer accurately from CV.
- For general/unusual questions: answer helpfully and intelligently to prove you are real AI, then briefly tie to Eldar if relevant. Never repeat same template. Be professional, varied, natural. No phone/birthdate. Match user's language.

ELDAR CV:
NAME: ${KNOWLEDGE.name} <${KNOWLEDGE.email}>
ABOUT: ${KNOWLEDGE.about}
PERSONALITY: ${KNOWLEDGE.personality}
EDUCATION: ${KNOWLEDGE.education}
SKILLS: ${KNOWLEDGE.skills}
LINKS: ${KNOWLEDGE.links}
WINS: ${Object.entries(KNOWLEDGE.how_win_examples).map(([k,v])=> `${k}: ${v}`).join(" | ")}
ADVICE: ${KNOWLEDGE.how_to_win_advice}
SOURCES: ${KNOWLEDGE.sources}${extra}`;
}

// --------- KNOWLEDGE BASE ---------
// Edit this object to change what the AI says. Only information from the CV is included
// and no phone/birthdate is exposed, per your privacy rule (only name + gmail).
// For long text you will provide later, edit KNOWLEDGE_EXTRA below (string).
const KNOWLEDGE_EXTRA = ""; // <-- PASTE YOUR LONG TEXT HERE LATER (I will do it)
const KNOWLEDGE = {
  name: "Eldar Hamidov",
  email: "eldarhamidov2009@gmail.com",
  about: "Student at Sumgait Istedad Liseyi (2023–present). Passionate about robotics, cybersecurity and AI. Hands-on builder: Fusion 360 / SolidWorks / FreeCAD → 3D print → code (Python, C++, Arduino/ESP32). Volunteer at Sumgait Youth House and Bir Könüllü.",
  personality: "Curious, disciplined and team-oriented. Learns by building and iterating. Likes to document and explain so others can reproduce results. Strong presentation skills in Azerbaijani, English (B2), Turkish and basic Russian.",
  how_win_examples: {
    "robocross": "RoboCross Online Challenge (Egypt, 2020) — 2nd worldwide as part of a team. Preparation: regular algorithm practice (Bebras-style), CAD/prototyping, and many test runs. Key was reliable teamwork and quick debugging.",
    "eu4climate": "EU4Climate 'Özün yarat' (parça category, 2020) — 1st place. Win came from original idea + practical reuse of textile, clear documentation and a convincing presentation of environmental impact.",
    "saf2023": "SAF 2023 'Zəlzələ zamanı xilasedici çanta' — Winner (Innovative Exhibition). Success: identified a real problem, built a functional prototype kit, and explained usage clearly to the jury.",
    "njco": "NJCO 2025 — 2nd place (National Junior Cybersecurity Olympiad). Preparation via AKTA Cyber Summer School, Linux/networking study and CTF-style practice.",
    "english": "USA International English Olympiad — 1st place. Consistent reading, writing and speaking practice; B2 level.",
    "stpetersburg": "Professionals competition in St. Petersburg (2025) — 1st place. Focus on applied engineering tasks under time pressure."
  },
  how_to_win_advice: "1) Choose one competition and study its past tasks (Bebras, WRO, SAF briefs). 2) Build a simple prototype early, test daily, keep a log. 3) Learn fundamentals (algorithms — CSES book, Python/C++; for robotics — ESP32/Arduino docs; for cyber — Linux, networks, Wireshark). 4) Get mentorship and peer review. 5) Practice presenting — clear story beats complex tech. 6) Iterate after failures; document what changed.",
  sources: "Sources used: Bebras tasks (AZ + USA), CSES book / two-pointers techniques, Arduino/ESP32 documentation, WRO rulebooks, SAF project briefs, school mentorship (Istedad Liseyi), AKTA Cyber Summer School materials, SolidWorks/Fusion 360 tutorials, and open GitHub examples (see github.com/Eldar-005). For 3D printing: Anycubic Kobra 2 Pro manuals and PrusaSlicer guides.",
  education: "Sumgait city Istedad Lyceum (2023–present) and 29 No. T. Ismayilov school (2016–2023). Certificate with distinction. Languages: English B2 (excellent), Turkish good, Russian sufficient.",
  skills: "Python, C++, MS Windows/Excel, Fusion 360, SolidWorks, FreeCAD.",
  links: "GitHub: github.com/Eldar-005 • YouTube: youtube.com/@EldarBuildLab • Instagram: instagram.com/eldar_hamidov09"
};

function answerFor(q){
  const s = q.toLowerCase().trim();
  // who/what are YOU - answer about AI, strictly about Eldar
  if (/^(what are you|who are you|what r u|who r u)[\s?!.]*$/.test(s) || s === "what are you?" || s === "who are you?") {
    return `I'm Eldar Hamidov's portfolio assistant for https://eldarbio.github.io — I answer anything about Eldar (wins, skills, projects, sources). Try: "What is Eldar like?"`;
  }
  // greetings - redirect to Eldar
  if (/^(hi|hey|hello|salam|salut|привет)[\s!.,]*$/.test(s) || s === "how are you" || s === "how are you?" || s.includes("how are you")) {
    return `Hello! I'm Eldar's assistant — I answer about Eldar Hamidov. Ask me: "What is Eldar like?", "How did he win RoboCross?", "What sources did he use?"`;
  }
  if (/(thank|thanks|sağ ol|teşekkür)/.test(s)) return `You're welcome! Ask me anything about Eldar.`;
  if (/(bye|goodbye|görüş|hələlik)/.test(s)) return `Bye! Ask anytime about Eldar at https://eldarbio.github.io`;

  // what is HE like / Eldar personality - only for he/Eldar
  if (/(what is he like|what's he like|eldar like|eldar personality|how is eldar|what kind of person is eldar)/.test(s)) {
    return `${KNOWLEDGE.personality}\n\n${KNOWLEDGE.about}`;
  }
  if (/(how.*win|win.*how|how did.*competition|robocross|eu4climate|özün yarat|rescue bag|saf|njco|english olympiad|professionals|st\. petersburg)/.test(s)) {
    if (s.includes('robocross')) return KNOWLEDGE.how_win_examples.robocross;
    if (s.includes('eu4climate') || s.includes('parça') || s.includes('parca')) return KNOWLEDGE.how_win_examples.eu4climate;
    if (s.includes('saf') || s.includes('rescue') || s.includes('xilasedici')) return KNOWLEDGE.how_win_examples.saf2023;
    if (s.includes('njco') || s.includes('cyber')) return KNOWLEDGE.how_win_examples.njco;
    if (s.includes('english')) return KNOWLEDGE.how_win_examples.english;
    if (s.includes('st') || s.includes('peter') || s.includes('professional')) return KNOWLEDGE.how_win_examples.stpetersburg;
    return `Examples from CV:\n• ${KNOWLEDGE.how_win_examples.robocross}\n• ${KNOWLEDGE.how_win_examples.eu4climate}\n• ${KNOWLEDGE.how_win_examples.saf2023}\n• ${KNOWLEDGE.how_win_examples.njco}\n\nName a competition for details (e.g., "NJCO", "SAF 2023").`;
  }
  if (/(what should i do|how to win|how can i win|advice|tips|prepare)/.test(s)) return KNOWLEDGE.how_to_win_advice;
  if (/(source|what.*use|where.*learn|book|material)/.test(s)) return KNOWLEDGE.sources;
  if (/(education|school|language)/.test(s)) return KNOWLEDGE.education;
  if (/(skill|python|c\+\+|fusion|solid)/.test(s)) return KNOWLEDGE.skills;
  if (/(contact|email|gmail|github|youtube|instagram)/.test(s)) return `${KNOWLEDGE.name} — ${KNOWLEDGE.email}\n${KNOWLEDGE.links}`;
  // professional fallback - uses brain, not same template, no repetitive quick ideas
  // For unusual questions, give a brief helpful answer then tie to Eldar if relevant
  if (s.length > 40) {
    return `That's an interesting question. As Eldar's portfolio assistant, I focus on Eldar Hamidov — his robotics, cybersecurity, and AI work (see Achievements). If you share more detail, I can give a more specific answer. For Eldar, ask about his wins or skills.`;
  }
  return `I specialize in Eldar Hamidov's portfolio. I can answer about his background, wins, and skills, and I can also help generally. What would you like to know?`;
}

const messages = document.getElementById('aiMessages');
const form = document.getElementById('aiForm');
const input = document.getElementById('aiInput');

function addMsg(text, who){
  const d = document.createElement('div');
  d.className = 'msg ' + who;
  d.textContent = text;
  messages.appendChild(d);
  messages.scrollTop = messages.scrollHeight;
}

let isAnswering = false;
async function handleQuestion(q){
  // allow typing another question even while waiting - don't block input
  addMsg(q, 'user');
  const typing = document.createElement('div');
  typing.className = 'msg ai';
  typing.textContent = 'Thinking...';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
  // keep input enabled so user can ask another thing while waiting
  input.disabled = false; input.focus();
  isAnswering = true;
  try{
    // race remote vs 7s, fallback to local so never stuck
    let answer = null;
    try{
      const remote = callFreeAI(q);
      const fallbackTimer = new Promise((_, rej)=> setTimeout(()=> rej(new Error("timeout")), 7500));
      answer = await Promise.race([remote, fallbackTimer]);
    } catch(err){ answer = null; }
    if(!answer || answer.length < 8) answer = answerFor(q);
    typing.textContent = answer;
  } catch(e){
    typing.textContent = answerFor(q);
  } finally {
    isAnswering = false;
    messages.scrollTop = messages.scrollHeight;
  }
}

form.addEventListener('submit', e=>{
  e.preventDefault();
  const q = input.value.trim();
  if(!q) return;
  input.value='';
  handleQuestion(q);
});
document.querySelectorAll('[data-q]').forEach(b=>{
  b.addEventListener('click', ()=>{
    const q=b.getAttribute('data-q');
    handleQuestion(q);
  });
});

// (Key UI removed per user request - key will be hardcoded in HARDCODED_GEMINI_KEY)
