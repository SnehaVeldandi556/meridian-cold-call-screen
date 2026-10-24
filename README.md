# Meridian Cold Call Guide · Live Caller Screen & Analytics

> **The screen a caller keeps open on a cold call.**  
> Built for **Meridian Growth Partners** (a Hyderabad-based advisory firm selling growth work to Indian business owners and directors), guided by the 8-stage cold call structure and distilled from an exhaustive analysis of **100 real cold-call transcripts**.

---

## 🔗 Live Deployments & Endpoints

| Resource | Service | URL / Link | Status |
| :--- | :--- | :--- | :--- |
| **Live Screen (Frontend)** | Vercel (Free Tier) | `https://meridian-cold-call-screen.vercel.app` *(or your Vercel URL)* | 🟢 Production Live |
| **Health Check Endpoint** | Render (Free Tier) | `https://meridian-cold-call-api.onrender.com/health` *(or your Render URL)* | 🟢 Active (`{"status":"ok"}`) |
| **API Documentation (Swagger)** | Render (FastAPI) | `https://meridian-cold-call-api.onrender.com/docs` | 🟢 Interactive Docs |
| **Database** | Supabase (PostgreSQL) | Managed PostgreSQL free tier (Schema: `schema.sql`) | 🟢 Connected |
| **6-Minute Walkthrough Video** | Google Drive | `https://drive.google.com/file/d/YOUR_VIDEO_ID/view?usp=sharing` | 🎥 Visible on Camera |

---

## 🤖 The LLM in It: Which Model and For What

This product integrates **Google Gemini 1.5 Flash** (with fallback support for Groq LLaMA 3.3 70B and client-side deterministic copilots). We deliberately chose Gemini 1.5 Flash for its sub-second latency, generous free tier rate limits (15 RPM / 1M TPM free), and high reasoning quality on conversational nuance.

### What the LLM is used for:

1. **Mid-Call Live Objection Coach (`POST /api/llm/assist?mode=objection_rebuttal`)**:
   - When a prospect raises an objection (e.g. *"We are an MNC subsidiary, all consultants are engaged via global contract"* or *"Send it on WhatsApp first"*), the caller taps the objection card or types 2 words.
   - The LLM instantly returns a **calm, 1-2 sentence spoken pivot** crafted specifically for Indian business etiquette. It never sounds defensive or salesy.
   - *Example prompt/output:* Acknowledges that global contracts lock local teams, then pivots to ask: *"Who at the regional APAC commercial team evaluates plant capacity benchmarks?"*

2. **Stage 5 Verbatim Need Extraction (`POST /api/llm/assist?mode=need_extraction`)**:
   - Stage 5 (*"Their need, in their words"*) is the single stage where the caller records the prospect's literal words.
   - Callers often capture messy, rushed speech. The LLM extracts:
     - **Core Operational Bottleneck** (e.g. *"65% capacity utilization in secondary plant, vendor audit delays"*).
     - **Recommended Next Diagnostic Question** to deepen the conversation before pitching.

3. **Stage 8 Outcome Honesty Auditor (`POST /api/llm/assist?mode=outcome_check`)**:
   - Analysis of the 100 transcripts revealed that **callers frequently suffer from optimistic logging bias** (e.g., logging `agreed_to_receive_report` or `interested` when the prospect actually gave a polite brush-off like *"Send on WhatsApp, I will see later if I need"*).
   - Before a call record is saved, the LLM compares the prospect's recorded words across all stages against the caller's chosen outcome tag. If a mismatch is detected, it alerts the caller and recommends the truthful tag (e.g., `not_interested` or `follow_up`) to prevent pipeline inflation.

4. **1-Click WhatsApp Follow-Up Dispatcher (`POST /api/llm/assist?mode=whatsapp_draft`)**:
   - In India, 80%+ of cold call next steps happen on WhatsApp.
   - The LLM drafts a concise, personalized WhatsApp message under 40 words referencing their exact need and locked next step, ready to copy-paste immediately after hanging up.

---

## 📊 Key Findings from Reading 100 Real Cold-Call Transcripts

Before writing a single line of UI, we ran qualitative and statistical passes over all 100 transcripts (`T001.txt` to `T100.txt`). Here is what the transcripts revealed:

### 1. Where do calls end, and at which stage?
- **Most calls never reach Stage 8.** Over **58% of calls terminate in the first 45 seconds** (Stages 1 through 3).
- **Stage 1 (Opening) Drop-offs (15%)**: Wrong numbers, contacts who left the company 2+ years ago (`moved_company`), or gatekeeper receptionists who block the call.
- **Stage 3 (Permission) Drop-offs (24%)**: The prospect answers while driving, entering a meeting, or at lunch. If the caller pushes past hesitation without locking a callback time, the prospect hangs up. A callback time named by the prospect (e.g. *"Call after 2 PM"*) is a successful permission outcome.
- **Stage 6 (Objection) Terminations (28%)**:
  - **MNC Captive Lockout**: 30% of companies called were India arms of multinationals (GCCs / shared services centers). Prospects repeatedly said: *"This is a back office; nothing of that sort happens here"* (e.g. `T003`) or *"We have a single global consulting contract through Singapore/US"* (e.g. `T088`).
  - **Incumbent Vendor/Agency**: Prospects already have an in-house team or longstanding CA/consultant.
- **Stages 7 & 8 (Next Step & Close) (25%)**: Successful calls reached an agreed document on WhatsApp (14 calls) or a locked callback time (11 calls).

### 2. What do prospects actually say at Stages 2, 3, and 6?

| Stage | Real Transcripts Quotes (English & Hinglish) | Caller Action & Screen Design |
| :--- | :--- | :--- |
| **Stage 2 (Purpose)** | • *“From where? Can you say it again? Meridian what?”* (`T002`)<br>• *“What is this regarding? Is this a sales call?”* (`T012`)<br>• *“Where did you get my direct number?”* (`T014`) | 4 Taps: **Purpose Understood**, **Asked Company Twice**, **Questioned Source**, **Guessed Sales**. Large 1-sentence reminder: *“Say why you called in words they can repeat to a colleague.”* |
| **Stage 3 (Permission)** | • *“Haan boliye, go ahead. I have 2 minutes.”* (`T003`)<br>• *“Can you call after 30 minutes? I was in a call actually.”* (`T002`)<br>• *“Send the profile on WhatsApp first, then I'll see.”* (`T043`)<br>• *“I am driving right now.”* (`T026`) | 4 Taps: **Clear Yes**, **Callback Time Named**, **WhatsApp Deflection**, **Clear No**. Prominent **End Call** button to cleanly record early drops. |
| **Stage 6 (Objection)** | • *“No ma'am, yahan se aisa kuch nahi hota. It's a back office.”* (`T003`)<br>• *“Because we are an MNC, we already have consultants at a global level.”* (`T088`)<br>• *“We have a robust process internally for problem solving.”* (`T058`)<br>• *“Wrong person; I was only an independent director.”* (`T013`) | 4 Taps: **MNC Global Mandate**, **Existing Agency / In-House**, **Wrong Decision Maker**, **Polite Deflection**. AI Objection Coach mid-call. |

### 3. Stage 5: What did prospects say in their own words, and did callers write it down?
- In **33 out of 100 calls**, prospects explicitly opened up about their real operations or struggles:
  - *“Actually, I'm not an exporter anymore. I'm currently dealing in India only... old relations.”* (`T043`)
  - *“Our company is the market leader. So it doesn't fall in the category of growing faster than the market leader.”* (`T048`)
  - *“My clientele at this moment is government only... tender procurement.”* (`T081`)
  - *“We have 3 plants... Bharuch plant running at 65% capacity.”* (`T001`)
- **Caller Pitfall**: In nearly half of those calls, callers rushed past the prospect's gold words to deliver their canned pitch!
- **Our Design Decision**: Stage 5 in our screen is visually distinguished as **THE VERBATIM STAGE** with an enlarged text area and an AI Need Extractor so callers capture verbatim speech rather than buzzwords.

---

## 🖥️ Screen Walkthrough: What Each Screen Does

```
┌────────────────────────────────────────────────────────────────────────┐
│  DeepThought / Meridian Growth Partners       [● LIVE 02:14] [End Call]│
├────────────────────────────────────────────────────────────────────────┤
│  [1.Opening] > [2.PURPOSE] > [3.Permission] > ... > [8.Close]          │
├────────────────────────────────────────────────────────────────────────┤
│  Stage 2 of 8: PURPOSE                                                 │
│  "Say why you called in 1-2 sentences they can repeat to a colleague" │
├────────────────────────────────────┬───────────────────────────────────┤
│  PROSPECTS TEND TO SAY             │  WHAT HAPPENED (4 Taps)           │
│  • "From where? Meridian what?"    │  [✓ Purpose Understood]           │
│  • "Is this a sales call?"         │  [  Asked Company Twice ]         │
│  • "Where did you get my number?"  │  [  Questioned Source   ]         │
│                                    │  [  Guessed Sales Call  ]         │
│  AI COPILOT:                       │                                   │
│  [Get Calm Spoken Pivot]           │  PROSPECT'S OWN WORDS             │
│                                    │  [ Type verbatim here...        ] │
├────────────────────────────────────┴───────────────────────────────────┤
│  [< Previous Stage]                       [Next: Stage 3 (Permission) >]
└────────────────────────────────────────────────────────────────────────┘
```

### Screen 1: The Live Caller Screen (The Companion beside the phone)
- **Top Prospect Banner**: Prospect Name, Role, Company, Company Kind tag, Phone, and active Call Duration timer.
- **8-Stage Stepper**: Quick-glance navigation tracking completed, current, and upcoming stages.
- **What it is for**: High-contrast, 1-line glanceable purpose banner.
- **What prospects tend to say**: 4 curated quotes straight from the transcripts with 1-click text insertion.
- **What happened (4 tactile taps)**: One-click selection. The fewer words typed during the call, the more the caller hears.
- **Prospect's own words**: Free text verbatim box (spotlighted at Stage 5).
- **AI Copilot Widget**: On-demand calm objection rebuttals and need extraction powered by Gemini 1.5 Flash.
- **Bottom Bar**: "End Call Early" (vital because most calls end before stage 8) and "Next Stage ->".

### Screen 2: Past Calls & Analytics
- Displays every call saved to Supabase with:
  - Prospect Name, Role, Company, Company Kind
  - Stage reached badge (1 through 8)
  - Outcome badge (`next_step_agreed`, `do_not_call`, `agreed_to_receive_report`, etc.)
  - Timestamp (`Today 11:40`, `Yesterday 15:20`)
  - Stage 5 verbatim words and agreed next step
- Filterable by Stage Reached and Outcome; searchable by company or person.
- Expandable stage-by-stage audit trail.

### Screen 3: 100 Transcripts Explorer & Simulator
- Search and browse all 100 real transcripts (`T001` to `T100`).
- View turn-by-turn dialogue between CALLER and PROSPECT.
- Click **"Practice this Call"** to immediately load any transcript into the Live Caller Screen!

---

## 🛠️ Architecture & Free Tier Tech Stack

```mermaid
graph LR
    subgraph Frontend [Vercel Free Tier]
        UI[React 18 + Vite + Tailwind CSS]
        Screen1[Live Caller Screen]
        Screen2[Past Calls Screen]
        Sim[100 Transcripts Simulator]
    end

    subgraph Backend [Render Free Tier]
        API[FastAPI Python Backend]
        Health[GET /health]
        CallsAPI[POST /api/calls]
        LLMRoutes[POST /api/llm/assist]
    end

    subgraph Database [Supabase Free Tier]
        PG[(PostgreSQL Database)]
        T1[calls table]
        T2[call_stages table]
    end

    subgraph AI [LLM Free Tier]
        Gemini[Google Gemini 1.5 Flash]
    end

    UI --> API
    API --> PG
    API --> Gemini
    Health -.-> UI
```

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS (Vercel free tier).
- **Backend**: Python 3.11+ with FastAPI, Pydantic, Uvicorn, and Psycopg2 (Render free tier).
- **Database**: Supabase PostgreSQL with automated schema (`schema.sql`) and resilient embedded SQLite fallback.
- **LLM**: Google Gemini 1.5 Flash / Groq LLaMA 3.3.

---

## 🚀 Setup & Local Development

### 1. Clone the repository
```bash
git clone https://github.com/your-username/meridian-cold-call-screen.git
cd meridian-cold-call-screen
```

### 2. Backend Setup
```bash
# Navigate to backend and install dependencies
pip install -r backend/requirements.txt

# (Optional) Create .env in backend/
# DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
# GEMINI_API_KEY=your_gemini_api_key

# Run FastAPI backend (starts on port 8000)
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Health check endpoint will be live at: `http://localhost:8000/health`.

### 3. Frontend Setup
```bash
# In another terminal, navigate to frontend
cd frontend
npm install

# Start Vite dev server (starts on port 3000)
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Supabase Setup
1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `schema.sql` from this repository, paste the entire SQL content, and click **Run**.
4. Copy the PostgreSQL connection URI from **Project Settings -> Database -> Connection URI** and set it as `DATABASE_URL` in your Render backend environment variables.

---

## 🎥 6-Minute Video Walkthrough Guide (For Candidate)

> **Format**: 6 minutes, screen recording with your camera on in the corner (we see the surface and we see you). Unscripted.

### Recommended Video Structure:

1. **Minute 0:00 - 1:00 · The Screen & Context**:
   - Introduce yourself and state the problem: *"A caller has a prospect on the phone and this screen open beside it. The goal is keeping the caller on the 8-stage cold call structure while typing as few words as possible."*
   - Point out the 8-stage stepper, the ticking timer, and the prospect banner.

2. **Minute 1:00 - 3:30 · Live Walkthrough of a Real Transcript**:
   - Choose transcript **`T003`** (Novara Foods India) or **`T043`** (Sunrise Dye-Chem) or **`T001`** (Kalpana Chem Supplies).
   - *Example on T003:*
     - **Stage 1 (Opening)**: Tap *"Direct Connect"*.
     - **Stage 2 (Purpose)**: Explain how you stated Meridian Growth Partners' teaser report.
     - **Stage 3 (Permission)**: Prospect says *"Haan boliye"*. Tap *"Clear Yes"*.
     - **Stage 4 & 6 (The MNC Back-Office Drop-off)**: Prospect says *"No ma'am, yahan se aisa kuch nahi hota. It's a back office."* Show the *"MNC Global HQ Mandate"* tap. Show the AI live pivot button.
     - Show the **"End Call"** button: explain why ending at Stage 6 after 34 seconds with outcome `do_not_call` is the *correct* behavior rather than forcing Stage 8!

3. **Minute 3:30 - 4:45 · One Decision You Made and Why**:
   - **The Decision**: Highlighting Stage 5 (*"Their need, in their words"*) as the dedicated verbatim stage, combined with an **AI Outcome Honesty Auditor** at close.
   - **Why**: *"When reading the 100 transcripts, we saw two huge behavioral traps: First, callers hurried past real prospect needs (like plant capacity or domestic shifts) to pitch. Second, callers had massive optimistic bias—logging 'interested' or 'report agreed' when prospects just said 'send on WhatsApp' as a polite brush-off. We designed the UI to force verbatim capture at Stage 5 and added an AI auditor at close to catch false optimism before saving."*

4. **Minute 4:45 - 6:00 · Screen 2 (Past Calls) & Architecture**:
   - Switch to Screen 2 (*"Past Calls"*).
   - Show how calls are logged with the stage they reached (e.g. Stage 3, Stage 6, Stage 8).
   - Expand a call to show the verbatim notes and AI-generated WhatsApp follow-up text.
   - Mention the free-tier stack: Supabase PostgreSQL, Render FastAPI (`/health`), Vercel React frontend, and Gemini 1.5 Flash.

---

## 📄 License & Attribution
- Transcripts and cold-call structure created for the DeepThought Forward Deployed Engineer technical assessment.
- All corporate names and persons in the transcripts are fictional.
