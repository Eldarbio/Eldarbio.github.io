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

// --------- KNOWLEDGE BASE ---------
// Edit this object to change what the AI says. Only information from the CV is included
// and no phone/birthdate is exposed, per your privacy rule (only name + gmail).
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
  const s = q.toLowerCase();

  // what am I like / personality
  if (/(like|personality|character|kind of person|what are you)/.test(s)) {
    return `${KNOWLEDGE.personality}\n\n${KNOWLEDGE.about}`;
  }
  // how did you win this competition
  if (/(how.*win|win.*how|how did.*competition|robocross|eu4climate|özün yarat|rescue bag|saf|njco|english olympiad|professionals|st\. petersburg)/.test(s)) {
    if (s.includes('robocross')) return KNOWLEDGE.how_win_examples.robocross;
    if (s.includes('eu4climate') || s.includes('parça') || s.includes('parca')) return KNOWLEDGE.how_win_examples.eu4climate;
    if (s.includes('saf') || s.includes('rescue') || s.includes('xilasedici')) return KNOWLEDGE.how_win_examples.saf2023;
    if (s.includes('njco') || s.includes('cyber')) return KNOWLEDGE.how_win_examples.njco;
    if (s.includes('english')) return KNOWLEDGE.how_win_examples.english;
    if (s.includes('st') || s.includes('peter') || s.includes('professional')) return KNOWLEDGE.how_win_examples.stpetersburg;
    // generic
    return `Examples from CV:\n• ${KNOWLEDGE.how_win_examples.robocross}\n• ${KNOWLEDGE.how_win_examples.eu4climate}\n• ${KNOWLEDGE.how_win_examples.saf2023}\n• ${KNOWLEDGE.how_win_examples.njco}\n\nWant details for a specific competition? Name it (e.g., "NJCO", "SAF 2023").`;
  }
  // what should I do to win
  if (/(what should i do|how to win|how can i win|advice|tips|prepare)/.test(s)) {
    return KNOWLEDGE.how_to_win_advice;
  }
  // sources
  if (/(source|what.*use|where.*learn|book|material)/.test(s)) {
    return KNOWLEDGE.sources;
  }
  if (/(education|school|language)/.test(s)) return KNOWLEDGE.education;
  if (/(skill|python|c\+\+|fusion|solid)/.test(s)) return KNOWLEDGE.skills;
  if (/(contact|email|gmail|github|youtube|instagram)/.test(s)) return `${KNOWLEDGE.name} — ${KNOWLEDGE.email}\n${KNOWLEDGE.links}`;
  if (/(hello|hi|hey|salam)/.test(s)) return `Hi! I'm the assistant for ${KNOWLEDGE.name}. Ask me: "What is he like?", "How did he win RoboCross?", "What should I do to win?" or "What sources did he use?"`;
  return `I can answer from the CV only. Try:\n• What is Eldar like?\n• How did you win [competition name]?\n• What should I do to win?\n• What sources did you use?\n• Contact / skills / education\n\n(Contact: ${KNOWLEDGE.email})`;
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

form.addEventListener('submit', e=>{
  e.preventDefault();
  const q = input.value.trim();
  if(!q) return;
  addMsg(q, 'user');
  input.value='';
  setTimeout(()=> addMsg(answerFor(q), 'ai'), 280);
});
document.querySelectorAll('[data-q]').forEach(b=>{
  b.addEventListener('click', ()=>{
    const q=b.getAttribute('data-q');
    addMsg(q,'user');
    setTimeout(()=> addMsg(answerFor(q),'ai'), 260);
  });
});
