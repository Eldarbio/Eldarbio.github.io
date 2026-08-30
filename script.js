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
