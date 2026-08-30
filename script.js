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

// AI Panel — slide from right
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
const aiFloat = document.getElementById('aiFloat');
let aiClickLocked = false;
aiFloat.addEventListener('click', ()=>{
  if(!aiClickLocked) openAI();
});
document.getElementById('aiClose').addEventListener('click', closeAI);
overlay.addEventListener('click', closeAI);
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeAI(); closeMobile(); }});

// --------- AI Button: Long-press vertical drag + 1-day memory ---------
(function(){
  const btn = document.getElementById('aiFloat');
  if(!btn) return;
  const STORAGE_KEY = "ai_float_pos_v2";
  const DAY_MS = 24 * 60 * 60 * 1000;
  const LONG_PRESS_MS = 500;
  const DRAG_THRESHOLD = 5;

  // Restore position if within 1 day
  function restorePosition(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return false;
      const data = JSON.parse(raw);
      if(Date.now() - data.ts > DAY_MS){ localStorage.removeItem(STORAGE_KEY); return false; }
      const maxTop = window.innerHeight - btn.offsetHeight - 10;
      const y = Math.max(10, Math.min(data.y, maxTop));
      btn.style.right = '18px';
      btn.style.bottom = 'auto';
      btn.style.top = y + 'px';
      btn.style.transform = 'none';
      btn.classList.add('ai-float--moved');
      return true;
    } catch(e){ return false; }
  }

  function savePosition(){
    try {
      const rect = btn.getBoundingClientRect();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ y: rect.top, ts: Date.now() }));
    } catch(e){}
  }

  function resetPosition(){
    btn.style.top = '';
    btn.style.bottom = '18px';
    btn.style.right = '18px';
    btn.style.transform = '';
    btn.classList.remove('ai-float--moved');
    localStorage.removeItem(STORAGE_KEY);
  }

  restorePosition();

  // Double-click to reset
  btn.addEventListener('dblclick', (e)=>{
    e.preventDefault();
    resetPosition();
  });

  // Long-press drag (vertical only)
  let longPressTimer = null;
  let isDragging = false;
  let isLongPress = false;
  let startY = 0;
  let origTop = 0;
  let moved = false;

  function onDown(e){
    if(e.button && e.button !== 0) return;
    const touch = e.touches ? e.touches[0] : e;
    startY = touch.clientY;
    const rect = btn.getBoundingClientRect();
    origTop = rect.top;
    moved = false;
    isDragging = false;
    isLongPress = false;

    longPressTimer = setTimeout(()=>{
      isLongPress = true;
      btn.classList.add('ai-float--dragging');
      btn.style.transform = 'none';
      try { navigator.vibrate && navigator.vibrate(30); } catch(e){}
    }, LONG_PRESS_MS);

    if(e.touches){
      btn.addEventListener('touchmove', onMove, {passive:false});
      btn.addEventListener('touchend', onUp);
      btn.addEventListener('touchcancel', onUp);
    } else {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
  }

  function onMove(e){
    const touch = e.touches ? e.touches[0] : e;
    const dy = touch.clientY - startY;

    if(!isLongPress){
      if(Math.abs(dy) > DRAG_THRESHOLD){
        clearTimeout(longPressTimer);
        isLongPress = true;
        btn.classList.add('ai-float--dragging');
        btn.style.transform = 'none';
      } else return;
    }

    e.preventDefault();
    moved = true;
    const newTop = origTop + dy;
    const maxTop = window.innerHeight - btn.offsetHeight - 10;
    const clampedTop = Math.max(10, Math.min(newTop, maxTop));
    btn.style.top = clampedTop + 'px';
    btn.style.bottom = 'auto';
  }

  function onUp(e){
    clearTimeout(longPressTimer);
    if(isLongPress && moved){
      aiClickLocked = true;
      setTimeout(()=>{ aiClickLocked = false; }, 300);
      savePosition();
    }
    btn.classList.remove('ai-float--dragging');
    isLongPress = false;
    isDragging = false;

    if(e.touches){
      btn.removeEventListener('touchmove', onMove);
      btn.removeEventListener('touchend', onUp);
      btn.removeEventListener('touchcancel', onUp);
    } else {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
  }

  btn.addEventListener('mousedown', onDown);
  btn.addEventListener('touchstart', onDown, {passive:true});

  // Re-clamp on resize
  window.addEventListener('resize', ()=>{
    if(btn.classList.contains('ai-float--moved')){
      const maxTop = window.innerHeight - btn.offsetHeight - 10;
      const cur = parseFloat(btn.style.top) || 0;
      btn.style.top = Math.max(10, Math.min(cur, maxTop)) + 'px';
    }
  });
})();

// --------- REAL FREE AI (public, not dumb) ---------
const _k_b64 = "QVEuQWI4Uk42SzVMaERNWHl6ZUFXV21HU2s4bHY4bzg5cE1VbjJVZGlVb05jR0VRVW1HQ2c=";
function _getKey(){ try{ return atob(_k_b64); } catch{ return ""; } }
async function callFreeAI(userQuestion){
  const system = buildSystemPrompt();
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
        let text = "";
        for(let i=parts.length-1; i>=0; i--){ if(parts[i].text && !parts[i].thought){ text = parts[i].text; break; } }
        if(!text) text = parts[0]?.text || "";
        if(text && text.trim().length > 8) return text.trim().slice(0, 2500);
      }
    } catch(e){ clearTimeout(timeout); }
  }
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

const MASTER_PROMPT = `# ELDAR AI — MASTER SYSTEM PROMPT
## Personal Biography, Portfolio, Personality & Knowledge Assistant
You are **Eldar AI**. Your primary purpose is to answer people's questions about **Eldar Həmidov** with **accuracy, naturalness, context, intelligence, and reliability**. You are not an ordinary general-purpose chatbot. You are Eldar's **digital biographical and portfolio assistant**.

Your core response priority is: **Accuracy > Natural communication > Context > Usefulness > Impressive presentation**
Never invent facts just to make Eldar sound more impressive.

# 1. ELDAR'S CORE PROFILE
Eldar Həmidov is a young, engineering-oriented creator interested in **technology, programming, engineering, robotics, artificial intelligence, computer vision, embedded systems, and cybersecurity**.
His interest in technology began at a very young age. Since childhood, he has been interested in solving problems and noticed how electronics and technology could help people with everyday problems.
For Eldar, technology is not merely theoretical knowledge. He prefers using technology to **solve real problems, build functioning systems, and create value for people**.
His development path: **LEGO → Robotics → Programming → Electronics → Engineering → AI → Computer Vision → Cybersecurity → Intelligent Physical Systems**
Personality: Hard-working, Responsible, Creative, Open to learning, Problem-solving oriented, Results-oriented, Persistent, Committed to long-term goals, Technically minded, Willing to take responsibility, Leadership-oriented, Able to break complex problems into manageable parts. Concepts: "A learner, problem solver, person who learns from mistakes, inventor, programmer, engineer."

# 2. CORE WAY OF THINKING
Eldar divides complex problems into smaller, manageable components. Strongest ability: **Turning complicated problems into simple, executable steps and carrying work through to completion.** He asks: Does it work? Does it solve a real problem? Does it produce measurable result? Can system be improved? Can result be made sustainable? Learning is valuable when applied to actual project.

# 3. MOTIVATION
Strongest motivation: **Achieving visible and measurable results** that affect real person/system/problem/society. Happy when: plan works, system functions, project completed, idea becomes product, technical problem solved. Frustrated by: carelessness, irresponsibility, "not my job", wasted potential, good ideas abandoned.

# 4. STRENGTHS AND AREAS OF DEVELOPMENT
Strengths: problem solving, technical learning, breaking complex problems, finishing what he starts, long-term goals, calm under pressure, creative thinking, combining fields, technical direction, learning from failure.
Development area: **Not becoming excessively focused on perfection.** High standards but learning to balance with time/efficiency. Phrase: "Eldar has high standards for quality, but he is learning to balance those standards with time, efficiency, and results."

# 5. LEADERSHIP
Leadership = **Providing direction + creating opportunities + strengthening team + taking responsibility**. Often **Technical leader** or **Idea generator + technical executor**. Not arrogant/dominant.

# 6. SOCIAL PERSONALITY
Ambivert. Can present, communicate with shared goal, meet new people, work deeply when needed. Values meaningful relationships, deeper long-lasting trust. Quietness does not mean coldness.

# 7. CHILDHOOD
Interested in solving problems since childhood, LEGO, considered math/CS teacher, first programming ~age 10 (robot moving in circles), first robotics ~age 11. Do not exaggerate as "world's most talented at 10".

# 8. COMPETITIONS AND ACHIEVEMENTS
RoboCross Online Challenge — 2nd worldwide (team), EU4Climate "Özün Yarat" — 1st, Yaz Elm Festivalı — 3rd, WRO Robot Virtual Games — Finalist, WRO Canada 2020-X — 5th, V Scratch Olympiad — National finalist, SAF 2021 — Finalist, Egypt Robotics (SUMracers) — 5th, EU4Climate 2022 finalist, ALP Logo — 4th, Teknofest Azerbaijan 2022 — Finalist, SAF 2023 — Winner "Rescue Bag During Earthquake" Innovative Exhibition, WRO Azerbaijan 2024 — Finalist, Sabahın Alimləri XIV — Physics finalist, AI Olympiad 2025 — Honor Roll, NJCO 2025 — 2nd, USA English Olympiad — 1st, Professionallar 2025 — 1st, Neo Science — 3rd, AIRO 2026 — 2nd, Bebras 2024-2025 semifinal, Bebras USA Honor Roll.

# 9. HOW TO DISCUSS ACHIEVEMENTS
Never invent/exaggerate. Preserve team vs individual, finalist vs winner. Correct: "Team Eldar participated with finished 2nd worldwide" not "world champion".

# 10. VIEW OF SUCCESS AND FAILURE
Success = **Creating work that touches lives, creates lasting value, leaves better system.** Failure = not falling down but refusing to get back up. WRO was early failure lesson: planning, discipline, adaptability matter.

# 11. TECHNICAL PROFILE
MS Windows, MS Excel, Python, C++, Fusion 360, SolidWorks, FreeCAD. Practical: Python, Computer Vision, OpenCV, MediaPipe, Face Recognition, Emotion Recognition, TensorFlow, PyTorch, Arduino, ESP32, Raspberry Pi, Orange Pi, Sensors, Servo motors, 3D printing, Robotics, CAD, Embedded systems. Phrase: "has worked with these through practical projects".

# 12. ROBOTICS
Combining mechanical, electronics, sensors, servos, microcontrollers, programming, AI into intelligent physical systems, not just building robots.

# 13. HIMARI
Personal AI assistant project: AI + computer vision + face/emotion + camera + gesture + servos. Not world's most advanced humanoid. Long-term vision: natural interaction, hardware integration.

# 14. OTHER PROJECTS
Robot Arm prototype, Aqua Fly rescue drone (SolidWorks, PETG). Do not invent specs, do not pretend unfinished is complete.

# 15. CYBERSECURITY
Interest expanded to cybersecurity, intersecting AI/robotics. NJCO 2nd, AKTA Cyber Summer School. Not just "hacker" but technology-oriented learner.

# 16. EDUCATION
Sumqayit City Istedad Lyceum 2016–2023, T. Ismayilov No.29 2023 onward, honors diploma. Languages: Azerbaijani primary, Turkish good, English B2, Russian basic.

# 17. ACADEMIC DIRECTION
Mechanical Engineering, Mechatronics, Robotics, AI, Computer Vision, Embedded Systems, Intelligent Systems. Intersection AI+Robotics+Embedded+Engineering. Aspires to MIT/Stanford level environments - say "are examples of high-level environments Eldar aspires to" not "will be admitted".

# 18. FUTURE VISION
Wants to be engineer, innovator, technology creator, AI/robotics professional, startup possibility. Goal: AI+Robotics+Intelligent Systems building real products that work and create value.

# 19. PERSONAL PHILOSOPHY
Principles: 1 Break problems down, 2 Learn from failure, 3 Ideas measured by implementation, 4 Technology purpose is solving problems, 5 Victory not endpoint, 6 Sustainable > single achievement, 7 Admitting not knowing is better than pretending, 8 Quality matters but not prevent progress.

# 20. VALUES TOWARD OTHER PEOPLE
Values honesty, responsibility, respect, intelligence, reliability, team spirit. Dislikes irresponsibility, carelessness, indifference, "not my job". Conflict: solve problem not attack person.

# 21. APPROACH TO COMPETITION
Healthy competition to test, identify weaknesses, improve, measure, learn. Loss is information.

# 22-51. RESPONSE RULES
Speak naturally, avoid empty praise, no genius/perfect claims without evidence, adapt length to question, never invent facts, distinguish fact/inference/unknown, preserve CV accuracy (2nd not 1st), distinguish team/individual, match user's language, be intelligent/calm/knowledgeable/humble/helpful, priority Accuracy > Natural > Context, never alter CV, never disclose phone/private email/address/passwords/API keys, only public contacts.

FINAL MISSION: Do not try to make Eldar look as good as possible. Try to represent Eldar as accurately as possible. Truth and biographical accuracy always come first.
ELDAR = Problem Solver + Builder + Programmer + Engineer + Innovator - "Someone who sees a problem, breaks it down, learns what is necessary, builds a solution, learns from mistakes, and keeps working toward something that actually functions."
`;

function buildSystemPrompt(){
  const extra = (typeof KNOWLEDGE_EXTRA !== "undefined" && KNOWLEDGE_EXTRA) ? `\n\nEXTRA INFO:\n${KNOWLEDGE_EXTRA}\n` : "";
  return `${MASTER_PROMPT}

ELDAR CV ADDENDUM (verified):
NAME: ${KNOWLEDGE.name} <${KNOWLEDGE.email}>
ABOUT: ${KNOWLEDGE.about}
PERSONALITY: ${KNOWLEDGE.personality}
EDUCATION: ${KNOWLEDGE.education}
SKILLS: ${KNOWLEDGE.skills}
LINKS: ${KNOWLEDGE.links}
WINS: ${Object.entries(KNOWLEDGE.how_win_examples).map(([k,v])=> `${k}: ${v}`).join(" | ")}
ADVICE: ${KNOWLEDGE.how_to_win_advice}
SOURCES: ${KNOWLEDGE.sources}${extra}

RULE: Use this master prompt personality for every answer. Be Eldar AI.`;
}

// --------- KNOWLEDGE BASE ---------
const KNOWLEDGE_EXTRA = "";
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

let _lastAnswer = "";
let _recentQs = [];
function answerFor(q){
  const s = q.toLowerCase().trim();
  // Normalize: remove punctuation for matching
  const n = s.replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g," ").trim();
  let ans = "";
  if (/^(what are you|who are you|what r u|who r u)$/.test(n)) {
    ans = `I'm Eldar Hamidov's portfolio assistant for https://eldarbio.github.io — I answer anything about Eldar (wins, skills, projects, sources). Try: "What is Eldar like?"`;
  } else if (/^(hi|hey|hello|salam|salut|privet)$/.test(n) || n === "how are you" || s.includes("how are you")) {
    const hellos = [
      `Hello! I'm Eldar's assistant — I answer about Eldar Hamidov. Ask me: "What is Eldar like?", "How did he win RoboCross?", "What sources did he use?"`,
      `Hey! I help with Eldar Hamidov's portfolio. Try: "What competitions did he win?" or "How should I prepare for NJCO?"`,
      `Salam! I'm here for Eldar's projects and achievements. What do you want to know?`
    ];
    ans = hellos[Math.abs(hashCode(n)) % hellos.length];
  } else if (/(thank|sağ ol|tesekkur)/.test(s)) ans = `You're welcome! Ask me anything about Eldar.`;
  else if (/(bye|goodbye|gorus|hələlik|helalik)/.test(s)) ans = `Bye! Ask anytime about Eldar at https://eldarbio.github.io`;
  else if (/(what is he like|whats he like|eldar like|eldar personality|how is eldar|what kind of person is eldar)/.test(s)) {
    ans = `${KNOWLEDGE.personality}\n\n${KNOWLEDGE.about}`;
  } else if (/(what.*competition.*won|what.*won.*competition|which.*competition.*won|competitions.*won|competitions.*win|did he win|has he won|list.*win)/.test(s)) {
    ans = `Eldar's verified WINS (not finalists):\n• EU4Climate "Özün yarat" (parça) — 1st (2020)\n• RoboCross Online Challenge (Egypt) — 2nd worldwide as team (2020)\n• Yaz Elm Festivalı (BMU) — 3rd (2021)\n• ALP Logo — 4th (2022)\n• SAF 2023 "Rescue Bag During Earthquake" — Winner, Innovative Exhibition (2023)\n• Neo Science Olympiad — 3rd\n• NJCO 2025 — 2nd\n• USA International English Olympiad — 1st (2025)\n• Professionallar St Petersburg — 1st (2025)\n• AIRO Azerbaijan Robotics Olympiad — 2nd (2026)\n• WRO Canada — 5th (counts as placement)\n\nNote: Finalists (WRO Panama, WRO Azerbaijan, SAF 2021, Teknofest 2022, Sabahın Alimləri etc.) are not counted as wins. Team achievements are marked as team.`;
  } else if (/(how.*win|win.*how|how did.*competition|robocross|eu4climate|özün yarat|rescue bag|saf|njco|english olympiad|professionals|st\. petersburg)/.test(s)) {
    if (s.includes('robocross')) ans = KNOWLEDGE.how_win_examples.robocross;
    else if (s.includes('eu4climate') || s.includes('parça') || s.includes('parca')) ans = KNOWLEDGE.how_win_examples.eu4climate;
    else if (s.includes('saf') || s.includes('rescue') || s.includes('xilasedici')) ans = KNOWLEDGE.how_win_examples.saf2023;
    else if (s.includes('njco') || s.includes('cyber')) ans = KNOWLEDGE.how_win_examples.njco;
    else if (s.includes('english')) ans = KNOWLEDGE.how_win_examples.english;
    else if (s.includes('st') || s.includes('peter') || s.includes('professional')) ans = KNOWLEDGE.how_win_examples.stpetersburg;
    else ans = `Examples from CV:\n• ${KNOWLEDGE.how_win_examples.robocross}\n• ${KNOWLEDGE.how_win_examples.eu4climate}\n• ${KNOWLEDGE.how_win_examples.saf2023}\n• ${KNOWLEDGE.how_win_examples.njco}\n\nName a competition for details (e.g., "NJCO", "SAF 2023").`;
  } else if (/(what should i do|how to win|how can i win|advice|tips|prepare)/.test(s)) ans = KNOWLEDGE.how_to_win_advice;
  else if (/(source|what.*use|where.*learn|book|material)/.test(s)) ans = KNOWLEDGE.sources;
  else if (/(education|school|language)/.test(s)) ans = KNOWLEDGE.education;
  else if (/(skill|python|c\+\+|fusion|solid)/.test(s)) ans = KNOWLEDGE.skills;
  else if (/(contact|email|gmail|github|youtube|instagram)/.test(s)) ans = `${KNOWLEDGE.name} — ${KNOWLEDGE.email}\n${KNOWLEDGE.links}`;
  else {
    // Generic fallback — varied so it never repeats verbatim
    const fallbacks = [
      `Good question! I focus on Eldar Hamidov — his robotics, cybersecurity and AI work (check Achievements). Tell me which area interests you — wins, skills, or projects — and I'll dive deeper.`,
      `I can help with Eldar's portfolio — background, wins and how he prepared. For example, try: "How did he win NJCO?" or "What sources did he use for Bebras?"`,
      `That's outside my main CV data, but I can still help. Eldar's key areas are robotics (WRO/RoboCross), cybersecurity (NJCO), and AI. What aspect do you want to explore?`,
      `Interesting! As Eldar's assistant I know his verified achievements and methods best. Ask about a specific competition, skill (Python, Fusion 360), or his advice for winning.`
    ];
    // Pick based on question hash + recent history to avoid repeat
    let idx = Math.abs(hashCode(s)) % fallbacks.length;
    // If same question asked before, rotate
    if(_recentQs.includes(n)) idx = (idx + _recentQs.length) % fallbacks.length;
    ans = fallbacks[idx];
    _recentQs.push(n); if(_recentQs.length>6) _recentQs.shift();
  }
  // Anti-repeat: if same answer as last time, append a nudge
  if(ans === _lastAnswer){
    const nudges = ["\n\n(P.S. Ask about a specific competition for a detailed story.)", "\n\n— Try a different angle, like 'How to prepare for WRO?'", ""];
    ans += nudges[Math.abs(hashCode(s+n)) % nudges.length];
  }
  _lastAnswer = ans;
  return ans;
}
function hashCode(str){ let h=0; for(let i=0;i<str.length;i++){ h=((h<<5)-h)+str.charCodeAt(i); h|=0;} return h; }

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
  addMsg(q, 'user');
  const typing = document.createElement('div');
  typing.className = 'msg ai';
  typing.textContent = THINKING_TEXT;
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
  input.disabled = false; input.focus();
  isAnswering = true;
  try{
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

// --- Language Switch EN/AZ ---
let THINKING_TEXT = "Thinking...";
const I18N = {
  en: {
    // Nav
    navAbout:"About", navSkills:"Skills", navAchievements:"Achievements", navProjects:"Projects", navContact:"Contact",
    askAI:"Ask AI about me",
    views:"views", uniqueViews:"unique per device",
    // Hero
    heroEyebrow:"Sumgait • İstedad Liseyi • Class of 2023–present",
    heroSubtitle:"Student • Developer • Robotics & Cybersecurity enthusiast",
    heroLead:"I build robots, explore AI and compete internationally — from RoboCross and WRO to NJCO and the International AI Olympiad. Focused on clean engineering, practical problem-solving and continuous learning.",
    heroBtnAbout:"About me", heroBtnAch:"Achievements",
    heroMeta1:'<strong>16</strong> yrs • Sumgait, Azerbaijan',
    heroMeta2:"English B2 • Russian • Turkish",
    // Card
    cardHead:"At a glance", cardTop:"Top results",
    cardTopV:"USA English Olympiad — 1st • Professionals St. Petersburg — 1st • NJCO — 2nd • AIRO 2026 — 2nd",
    cardStacks:"Stacks", cardEdu:"Education",
    cardEduV:"Sumgait İstedad Liseyi (2023–present) • Fərqlənmə attestat",
    cardLinks:"Links", cardNote:"Works on phone, tablet and desktop.",
    // About
    aboutTitle:"About", aboutSub:"What drives me — and how I work.",
    aboutP1:'I\'m a student at <strong>Sumgait İstedad Liseyi</strong> with a strong interest in robotics, cybersecurity and applied AI. I enjoy taking an idea from sketch (Fusion 360 / FreeCAD) to a working prototype, and then documenting and sharing the process.',
    aboutP2:'Competitions taught me to work under constraints, iterate quickly and learn from failures — whether it was RoboCross, WRO Virtual Games, SAF or Teknofest. I value teamwork, clear communication and reliable follow-through.',
    aboutP3:'I also volunteer with <strong>Sumgait Youth House</strong> and <strong>Bir Könüllü</strong>, helping with events and peer trainings (e.g., "Data sphere job divisions", 2026).',
    aboutLikeTitle:"What I'm like",
    aboutLike1:"Curious and disciplined — consistent practice over last-minute cramming.",
    aboutLike2:"Hands-on builder — CAD → 3D print → code → test.",
    aboutLike3:"Team player — experience in SUMracers and cross-school teams.",
    aboutLike4:"Communicative — comfortable presenting in Azerbaijani, English (B2) and Turkish.",
    aboutMore:'Want more? Ask the assistant → top-right "Ask AI about me".',
    // Skills
    skillsTitle:"Skills",
    skLangT:"Languages & Code", skLangD:"Python, C++ — algorithms, Bebras-style problem solving, Arduino/ESP32.",
    skDesignT:"Design & Fabrication", skDesignD:"Fusion 360, SolidWorks, FreeCAD — modeling for robotics and 3D printing (Anycubic Kobra 2 Pro).",
    skCyberT:"Cybersecurity", skCyberD:"NJCO II (2025), AKTA Cyber Summer School — networks, OSINT, Linux, wire analysis.",
    skHumanT:"Languages", skHumanD:"Azerbaijani (native), English B2 — excellent, Turkish — good, Russian — sufficient.",
    // Achievements
    achTitle:"Achievements", achSub:"Every competition & award from my CV — chronological.",
    ach1:'EU-funded, UNDP & Ministry of Ecology project — <strong>I place</strong>',
    ach2:'International virtual robotics — <strong>II worldwide</strong> (team)',
    ach3:'Virtual World Robot Olympiad — <strong>Finalist</strong>',
    ach4:'Virtual World Robot Olympiad — <strong>V place</strong>',
    ach5:'Baku Engineering University Student Scientific Society — <strong>III place</strong>',
    ach6:'National selection — <strong>Finalist</strong>',
    ach7:'Ministry of Education — <strong>Finalist</strong>',
    ach8:'Team SUMracers — <strong>V place</strong>',
    ach9:'<strong>IV place</strong>',
    ach10:'<strong>Finalist</strong>',
    ach11:'<strong>Finalist</strong>',
    ach12:'Algorithm competitions — <strong>Participant</strong>',
    ach13:'Innovative Exhibition category — <strong>Winner</strong>',
    ach14:'<strong>III place</strong>',
    ach15:'<strong>Finalist</strong>',
    ach16:'2024-2025 — <strong>Semifinal</strong>',
    ach17:'<strong>Honor Roll</strong>',
    ach18:'Republic competition — <strong>Finalist & participation certificate</strong>',
    ach19:'<strong>Honor Roll</strong>',
    ach20:'<strong>Participant</strong>',
    ach21:'<strong>II place</strong>',
    ach22:'<strong>I place</strong>',
    ach23:'<strong>I place</strong>',
    ach24:'<strong>II place</strong>',
    ach25:'"Ayın aktiv və fəal könüllüsü" & "Bir Könüllü" Data spheres training — <strong>2026</strong>',
    ach26:'<strong>Fərqlənmə attestatı</strong> (with distinction)',
    // Projects
    projTitle:"Projects",
    proj1T:"eldar_hasc2025 — AI project",
    proj1D:"Repository for Human-AI / AI Olympiad work — code, datasets and write-ups.",
    proj2T:'Rescue Bag — SAF 2023 Winner',
    proj2D:'"Zəlzələ zamanı xilasedici çanta" — innovative exhibition winner. Concept for emergency support with practical kit and guidance.',
    proj3T:"YouTube — Eldar Build Lab",
    proj3D:"Build logs, robotics tests and explanations — aimed at students who want to reproduce results.",
    // Contact
    contactTitle:"Contact", contactSub:"Only public contact — as you requested.",
    // AI Panel
    aiTitle:"Ask about Eldar", aiSub:"Answers only from your CV + the knowledge you provide. No personal numbers.",
    aiWelcome:'Hi! I\'m Eldar\'s portfolio assistant. Try:<br>• "What is Eldar like?"<br>• "How did you win this competition?"<br>• "What should I do to win?"<br>• "What sources did you use?"',
    aiSug1:"What is he like?", aiSug2:"How did he win?",
    aiSug3:"How to win?", aiSug4:"Sources?",
    aiSend:"Send", aiInputPH:"Ask something...",
    // Footer
    footerText:"© 2026 Eldar Hamidov",
    thinkingText:"Thinking..."
  },
  az: {
    // Nav
    navAbout:"Haqqımda", navSkills:"Bacarıqlar", navAchievements:"Nailiyyətlər", navProjects:"Layihələr", navContact:"Əlaqə",
    askAI:"AI-dan soruş",
    views:"baxış", uniqueViews:"hər cihaz üçün 1 dəfə",
    // Hero
    heroEyebrow:"Sumqayıt • İstedad Liseyi • 2023–indiyədək",
    heroSubtitle:"Şagird • Developer • Robototexnika və Kibertəhlükəsizlik həvəskarı",
    heroLead:"Robotlar qururam, süni intellekti kəşf edirəm və beynəlxalq yarışlarda iştirak edirəm — RoboCross və WRO-dan NJCO və Beynəlxalq AI Olimpiadasına qədər. Təmiz mühəndislik və praktik problem həllinə fokuslanıram.",
    heroBtnAbout:"Haqqımda", heroBtnAch:"Nailiyyətlər",
    heroMeta1:'<strong>16</strong> yaş • Sumqayıt, Azərbaycan',
    heroMeta2:"İngilis B2 • Rus • Türki",
    // Card
    cardHead:"Qısa baxış", cardTop:"Əsas nəticələr",
    cardTopV:"USA English Olympiad — 1-ci • Professionals Saint Petersburg — 1-ci • NJCO — 2-ci • AIRO 2026 — 2-ci",
    cardStacks:"Texnologiyalar", cardEdu:"Təhsil",
    cardEduV:"Sumqayıt İstedad Liseyi (2023–indiyədək) • Fərqlənmə attestatı",
    cardLinks:"Keçidlər", cardNote:"Telefon, planşet və kompüterdə işləyir.",
    // About
    aboutTitle:"Haqqımda", aboutSub:"Məni nə motivasiya edir və necə işləyirəm.",
    aboutP1:'Mən <strong>Sumqayıt İstedad Liseyinin</strong> şagirdiyəm, robototexnika, kibertəhlükəsizlik və tətbiqi süni intellektə böyük marağım var. İdeyanı eskizdən (Fusion 360 / FreeCAD) işlək prototipə çevirməyi və prosesi sənədləşdirməyi sevirəm.',
    aboutP2:'Yarışlar mənə məhdudiyyətlər altında işləməyi, tez iterasiya etməyi və uğursuzluqlardan öyrənməyi öyrətdi — RoboCross, WRO Virtual Games, SAF və ya Teknofest olsun. Komanda işini, aydın ünsiyyəti və məsuliyyəti dəyərləndirirəm.',
    aboutP3:'Həmçinin <strong>Sumqayıt Gənclər Evi</strong> və <strong>Bir Könüllü</strong> ilə könüllülük edirəm, tədbirlərə və təlimlərə kömək edirəm (məs., "Data sferasında iş bölgüləri", 2026).',
    aboutLikeTitle:"Necə biriyəm",
    aboutLike1:"Maraqlı və intizamlı — son anda əzbərləmək əvəzinə müntəzəm məşq.",
    aboutLike2:"Praktik qurucu — CAD → 3D çap → kod → test.",
    aboutLike3:"Komanda oyunçusu — SUMracers və məktəblərarası komandalarda təcrübə.",
    aboutLike4:"Ünsiyyətcil — Azərbaycan, ingilis (B2) və türk dillərində təqdimat.",
    aboutMore:'Daha çox? Köməkçidən soruş → yuxarı sağ "AI-dan soruş".',
    // Skills
    skillsTitle:"Bacarıqlar",
    skLangT:"Dillər və Kod", skLangD:"Python, C++ — alqoritmlər, Bebras tipli məsələlər, Arduino/ESP32.",
    skDesignT:"Dizayn və İstehsal", skDesignD:"Fusion 360, SolidWorks, FreeCAD — robototexnika və 3D çap üçün modelləşdirmə (Anycubic Kobra 2 Pro).",
    skCyberT:"Kibertəhlükəsizlik", skCyberD:"NJCO II (2025), AKTA Cyber Summer School — şəbəkələr, OSINT, Linux, simsiz təhlil.",
    skHumanT:"Dillər", skHumanD:"Azərbaycan (ana dil), İngilis B2 — əla, Türk — yaxşı, Rus — kifayət.",
    // Achievements
    achTitle:"Nailiyyətlər", achSub:"CV-dən bütün yarış və mükafatlar — xronoloji.",
    ach1:'EU tərəfindən maliyyələşdirilən, UNDP və Ekologiya Nazirliyi layihəsi — <strong>1-ci yer</strong>',
    ach2:'Beynəlxalq virtual robototexnika — <strong>Dünya üzrə 2-ci</strong> (komanda)',
    ach3:'Virtual Dünya Robot Olimpiadası — <strong>Finalçı</strong>',
    ach4:'Virtual Dünya Robot Olimpiadası — <strong>5-ci yer</strong>',
    ach5:'Bakı Mühəndislik Universiteti Tələbə Elmi Cəmiyyəti — <strong>3-cü yer</strong>',
    ach6:'Milli seçim — <strong>Finalçı</strong>',
    ach7:'Təhsil Nazirliyi — <strong>Finalçı</strong>',
    ach8:'Komanda SUMracers — <strong>5-ci yer</strong>',
    ach9:'<strong>4-cü yer</strong>',
    ach10:'<strong>Finalçı</strong>',
    ach11:'<strong>Finalçı</strong>',
    ach12:'Alqoritm yarışları — <strong>İştirakçı</strong>',
    ach13:'İnnovativ Sərgi kateqoriyası — <strong>Qalib</strong>',
    ach14:'<strong>3-cü yer</strong>',
    ach15:'<strong>Finalçı</strong>',
    ach16:'2024-2025 — <strong>Yarımfinalçı</strong>',
    ach17:'<strong>Şərəf Siyahısı</strong>',
    ach18:'Respublika yarışması — <strong>Finalçı və iştirak sertifikatı</strong>',
    ach19:'<strong>Şərəf Siyahısı</strong>',
    ach20:'<strong>İştirakçı</strong>',
    ach21:'<strong>2-ci yer</strong>',
    ach22:'<strong>1-ci yer</strong>',
    ach23:'<strong>1-ci yer</strong>',
    ach24:'<strong>2-ci yer</strong>',
    ach25:'"Ayın aktiv və fəal könüllüsü" və "Bir Könüllü" Data sferası təlimi — <strong>2026</strong>',
    ach26:'<strong>Fərqlənmə attestatı</strong> (fərqlənmə ilə)',
    // Projects
    projTitle:"Layihələr",
    proj1T:"eldar_hasc2025 — AI layihəsi",
    proj1D:"Human-AI / AI Olimpiadası işi üçün repository — kod, veri dəstləri və yazılar.",
    proj2T:'Rescue Bag — SAF 2023 Qalibi',
    proj2D:'"Zəlzələ zamanı xilasedici çanta" — iinnovativ sərgi qalibi. Fövqəladə dəstək üçün praktik dəst və təlimat konsepsiyası.',
    proj3T:"YouTube — Eldar Build Lab",
    proj3D:"Sınaq qeydləri, robototexnika testləri və izahlar — nəticələri təkrar istəyən şagirdlər üçün.",
    // Contact
    contactTitle:"Əlaqə", contactSub:"Yalnız ictimai əlaqə — istədiyiniz kimi.",
    // AI Panel
    aiTitle:"Eldar haqqında soruş", aiSub:"Yalnız CV və verdiyiniz məlumatlardan cavab verir. Şəxsi nömrə yoxdur.",
    aiWelcome:'Salam! Mən Eldar-ın portfolio köməkçisiyəm. Cəhd edin:<br>• "O necə biri?"<br>• "Bu yarışmanı necə qazandı?"<br>• "Mən necə qazana bilərəm?"<br>• "Hansı mənbələrdən istifadə etdiniz?"',
    aiSug1:"O necə biri?", aiSug2:"Necə qazandı?",
    aiSug3:"Necə qazana bilərəm?", aiSug4:"Mənbələr?",
    aiSend:"Göndər", aiInputPH:"Bir şey soruş...",
    // Footer
    footerText:"© 2026 Eldar Həmidov",
    thinkingText:"Düşünür..."
  }
};

function setLang(lang){
  const t = I18N[lang] || I18N.en;
  document.documentElement.lang = lang;
  THINKING_TEXT = t.thinkingText || "Thinking...";
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.getAttribute("data-i18n");
    if(t[k] !== undefined){
      if(k.startsWith("aboutP") || k.startsWith("heroMeta") || k.startsWith("ach") || k === "aiWelcome") el.innerHTML = t[k];
      else el.textContent = t[k];
    }
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
    const k = el.getAttribute("data-i18n-ph");
    if(t[k] !== undefined) el.placeholder = t[k];
  });
  document.querySelectorAll(".lang-btn").forEach(b=> b.classList.toggle("active", b.dataset.lang===lang));
  localStorage.setItem("site_lang", lang);
}
document.querySelectorAll(".lang-btn").forEach(b=> b.addEventListener("click", ()=> setLang(b.dataset.lang)));
setLang(localStorage.getItem("site_lang") || "en");

// --- View Count (global, +1 per new device, never on refresh) ---
(function(){
  const els = [document.getElementById("viewCount"), document.getElementById("viewCountTop")].filter(Boolean);
  if(!els.length) return;
  const API = "https://countapi.mileshilliard.com/api/v1";
  const KEY = "eldarbio_portfolio_visits_v3";
  const FLAG = "view_counted_eldarbio_v3";
  const LOCAL_KEY = "local_view_count_v3";
  const hasCounted = localStorage.getItem(FLAG) === "1";
  els.forEach(e=> e.textContent = "…");
  function setAll(v){ els.forEach(e=> e.textContent = v); }

  async function tryFetch(url){
    const ctrl = new AbortController();
    const t = setTimeout(()=> ctrl.abort(), 4500);
    try{
      const res = await fetch(url, { cache:"no-store", signal: ctrl.signal, mode:"cors" });
      clearTimeout(t);
      if(res.ok){
        const data = await res.json();
        if(data && typeof data.value === "number") return data.value;
      }
    } catch(e){ clearTimeout(t); }
    return null;
  }

  (async function(){
    const mode = hasCounted ? "get" : "hit";
    let v = await tryFetch(`${API}/${mode}/${KEY}`);
    if(v === null) v = await tryFetch(`https://corsproxy.io/?${encodeURIComponent(`${API}/${mode}/${KEY}`)}`);
    if(v === null) v = await tryFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`${API}/${mode}/${KEY}`)}`);
    if(v !== null){
      setAll(v.toLocaleString());
      if(!hasCounted) localStorage.setItem(FLAG, "1");
      localStorage.setItem(LOCAL_KEY, String(v));
      return;
    }
    let n = parseInt(localStorage.getItem(LOCAL_KEY) || "0", 10);
    if(!hasCounted){ n = (n || 0) + 1; localStorage.setItem(LOCAL_KEY, String(n)); localStorage.setItem(FLAG, "1"); }
    else if(n === 0){ n = 1; localStorage.setItem(LOCAL_KEY, "1"); }
    setAll(n.toLocaleString() + " • offline");
  })();
})();
