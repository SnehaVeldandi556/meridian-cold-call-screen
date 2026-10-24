"""
Stages configuration curated from the 100 Meridian Growth Partners cold-call transcripts
and DeepThought structure guidelines.
"""

STAGES_DATA = [
    {
        "number": 1,
        "name": "Opening",
        "badge": "01",
        "tagline": "Reach the right person and say who you are",
        "purpose": "Reach the right person and say who you are. The prospect decides in the first ten seconds whether this call is worth a minute.",
        "caller_focus": "Speak calmly and with natural cadence. Confirm identity without sounding like a robotic telemarketer.",
        "may_say": [
            {"quote": "Haan ji? / Yes, tell me.", "context": "Busy executive answering curtly"},
            {"quote": "Am I speaking with Leonard sir? ... Yes, Leonard here. What is this?", "context": "Founder / CEO cautious of identity"},
            {"quote": "I am driving / in a meeting right now, what is this regarding?", "context": "Immediate environment friction"},
            {"quote": "You reached the switchboard. Who do you want to connect to?", "context": "Gatekeeper / receptionist screening"},
            {"quote": "He left the company two years ago, I handle operations now.", "context": "Stale CRM contact record"}
        ],
        "taps": [
            {"id": "direct_connect", "label": "Direct Connect", "desc": "Right person answered & listening", "color": "blue"},
            {"id": "gatekeeper", "label": "Gatekeeper / Reception", "desc": "Assistant or front desk screening call", "color": "amber"},
            {"id": "bad_time", "label": "Bad Time / Driving / Meeting", "desc": "Physically unable to talk right now", "color": "orange"},
            {"id": "wrong_person", "label": "Wrong Person / Left Company", "desc": "Person moved or wrong contact info", "color": "red"}
        ],
        "default_tap": "direct_connect",
        "next_stage_hint": "Stage 2: Purpose (Say why you called in 1-2 sentences)"
    },
    {
        "number": 2,
        "name": "Purpose",
        "badge": "02",
        "tagline": "Say in 1-2 sentences why you called",
        "purpose": "Say in one or two sentences why you called, in words the prospect can repeat to a colleague. A purpose they cannot repeat is a purpose they did not hear.",
        "caller_focus": "Avoid generic consulting jargon. Anchor to Meridian Growth Partners and a tangible teaser analysis of their business.",
        "may_say": [
            {"quote": "From where? Can you repeat the company name? Meridian what?", "context": "Prospect missed firm name; label went over their head"},
            {"quote": "What is this regarding? Is this a sales call?", "context": "Prospect smells an aggressive pitch and puts guard up"},
            {"quote": "Where did you get my direct mobile number?", "context": "Privacy barrier; needs clear, legitimate sourcing answer"},
            {"quote": "What does a growth report actually mean for a company like ours?", "context": "Skeptical curiosity about deliverable value"}
        ],
        "taps": [
            {"id": "purpose_understood", "label": "Purpose Understood", "desc": "Prospect heard and acknowledged reason for call", "color": "emerald"},
            {"id": "asked_company_twice", "label": "Asked Company Name Twice", "desc": "Company name label missed; had to re-explain", "color": "amber"},
            {"id": "questioned_number_source", "label": "Questioned Source of Number", "desc": "Demanded to know where caller sourced contact", "color": "purple"},
            {"id": "guessed_sales_call", "label": "Guessed Sales / Defensive", "desc": "Pushed back assuming transactional cold pitch", "color": "red"}
        ],
        "default_tap": "purpose_understood",
        "next_stage_hint": "Stage 3: Permission (Find out if they are willing to talk now)"
    },
    {
        "number": 3,
        "name": "Permission",
        "badge": "03",
        "tagline": "Find out whether they are willing to talk now",
        "purpose": "Find out whether they are willing to talk now. A clear yes, a clear no, or a time to call back are all good outcomes. Talking on without one is not.",
        "caller_focus": "Do not ramble if you hear hesitation. A confirmed callback time is 10x better than forcing an unwilling listener.",
        "may_say": [
            {"quote": "Haan boliye, go ahead. I have two minutes.", "context": "Clear permission granted; prospect is timing you"},
            {"quote": "Can you call after 30 minutes / after 2 PM? I was in a call actually.", "context": "Specific callback window offered"},
            {"quote": "Send the profile on WhatsApp first, then I will decide.", "context": "Classic Indian B2B brush-off deflection"},
            {"quote": "Not right now, we are a startup / currently in month-end audit.", "context": "Clear timing no; explore future window"}
        ],
        "taps": [
            {"id": "clear_yes", "label": "Clear Yes (Go Ahead)", "desc": "Granted permission to converse now", "color": "emerald"},
            {"id": "callback_named", "label": "Callback Time Named", "desc": "Prospect named specific time (e.g., after 2 PM)", "color": "blue"},
            {"id": "whatsapp_deflection", "label": "WhatsApp / Email Deflection", "desc": "Polite brush-off: 'Send profile on WhatsApp first'", "color": "amber"},
            {"id": "clear_no", "label": "Clear No / Drop Call", "desc": "Flat refusal; do not continue without permission", "color": "red"}
        ],
        "default_tap": "clear_yes",
        "next_stage_hint": "Stage 4: Their business (Ask about their operations before pitching)"
    },
    {
        "number": 4,
        "name": "Their business",
        "badge": "04",
        "tagline": "Ask about their company and work before yours",
        "purpose": "Ask about their company and their work before saying anything about yours. People talk about what they do; they rarely listen to what you do.",
        "caller_focus": "Hold back your pitch! Ask an intelligent diagnostic question about their facilities, capacity, or market footprint.",
        "may_say": [
            {"quote": "We are an MNC back-office / captive unit; no commercial ops here.", "context": "Crucial structural clarification (GCC / shared services)"},
            {"quote": "We only manufacture for domestic clients now, no export business.", "context": "Correcting caller premise on business model"},
            {"quote": "Tell me what Meridian does first before I tell you about my company.", "context": "Prospect turns table; wants credentials"},
            {"quote": "We run two plants in Gujarat at 75% capacity.", "context": "Prospect opened up; shared operational detail"}
        ],
        "taps": [
            {"id": "shared_operations", "label": "Shared Operations & Scope", "desc": "Explained plants, team, domestic vs export mix", "color": "emerald"},
            {"id": "corrected_premise", "label": "Corrected Company Scope", "desc": "Captive unit, domestic only, or subsidiary", "color": "amber"},
            {"id": "turned_tables", "label": "Turned Tables on Caller", "desc": "Demanded: 'Tell me about Meridian first'", "color": "purple"},
            {"id": "guarded_one_liner", "label": "Guarded / One-Liner Answer", "desc": "Minimalist response waiting for the pitch", "color": "orange"}
        ],
        "default_tap": "shared_operations",
        "next_stage_hint": "Stage 5: Their need, in their words (Hear what they are struggling with)"
    },
    {
        "number": 5,
        "name": "Their need, in their words",
        "badge": "05",
        "tagline": "The verbatim stage: record their exact words",
        "purpose": "Hear what they are trying to do or struggling with, in their own words. This is the one stage where the caller writes down exactly what was said.",
        "caller_focus": "CRITICAL VERBATIM STAGE. Do not paraphrase into marketing buzzwords. Type the prospect's literal words.",
        "may_say": [
            {"quote": "Capacity utilization in our secondary plant is lagging behind target.", "context": "Manufacturing bottleneck voiced"},
            {"quote": "Finding steady B2B clients in North India has been our main bottleneck.", "context": "Geographic sales expansion struggle"},
            {"quote": "Everything is running smoothly, we do not have any need right now.", "context": "Claiming self-sufficiency / zero pain"},
            {"quote": "What can a consulting firm like yours do for an industrial manufacturer?", "context": "Challenging firm credibility in heavy industry"}
        ],
        "taps": [
            {"id": "concrete_need_voiced", "label": "Voiced Concrete Need / Goal", "desc": "Shared specific operational pain or expansion target", "color": "emerald"},
            {"id": "nothing_needed_fine", "label": "Claimed 'Nothing Needed'", "desc": "Asserted full satisfaction and zero requirements", "color": "amber"},
            {"id": "challenged_capability", "label": "Challenged Relevance", "desc": "Asked how Meridian can help their specific vertical", "color": "purple"},
            {"id": "internal_team_handling", "label": "Internal Process Solving", "desc": "Already have an internal mechanism handling it", "color": "blue"}
        ],
        "default_tap": "concrete_need_voiced",
        "next_stage_hint": "Stage 6: Objection (Hear the reason for a no and understand it)"
    },
    {
        "number": 6,
        "name": "Objection",
        "badge": "06",
        "tagline": "Hear the reason for a no and understand it",
        "purpose": "Hear the reason for a no and understand it. A reason you understand can be answered on this call or the next; a reason you talked over cannot.",
        "caller_focus": "Never argue or interrupt. Acknowledge the constraint sincerely. If it's a hard barrier (e.g. MNC captive), accept gracefully.",
        "may_say": [
            {"quote": "Because we are an MNC, all consultants are engaged via global HQ contract.", "context": "Global procurement lockout; no local discretion"},
            {"quote": "We already have an in-house strategy team and an existing agency.", "context": "Incumbent vendor or internal capability barrier"},
            {"quote": "I am not the decision maker; speak to the promoter / MD directly.", "context": "Wrong authority level reached"},
            {"quote": "Send something in writing on email and we will see.", "context": "Polite brush-off mask for lack of interest"}
        ],
        "taps": [
            {"id": "mnc_global_mandate", "label": "MNC Global HQ Mandate", "desc": "Strict vendor procurement via overseas headquarters", "color": "red"},
            {"id": "incumbent_agency", "label": "Existing Agency / In-House", "desc": "Already partnered with consultant or internal team", "color": "orange"},
            {"id": "not_decision_maker", "label": "Not Decision Maker", "desc": "Referred to Promoter, MD, or commercial lead", "color": "purple"},
            {"id": "polite_brush_off", "label": "Polite Deflection ('Send Email')", "desc": "Asks for email with zero intent to review", "color": "amber"}
        ],
        "default_tap": "incumbent_agency",
        "next_stage_hint": "Stage 7: Next step (Agree one concrete thing: WhatsApp doc or meeting)"
    },
    {
        "number": 7,
        "name": "Next step",
        "badge": "07",
        "tagline": "Agree one concrete thing: document, time, or referral",
        "purpose": "Agree one concrete thing: a document on WhatsApp or email, a call at a named time, a meeting. One thing, named, with a time or a channel.",
        "caller_focus": "A time named by THEM is worth 10x more than a time proposed by YOU. Lock channel and exact timestamp.",
        "may_say": [
            {"quote": "Yes, send the growth report on WhatsApp, I will review it tonight.", "context": "Agreement to document on WhatsApp"},
            {"quote": "Call me on Thursday at 4 PM, I will be free after my factory visit.", "context": "High-value commitment: prospect named time"},
            {"quote": "Speak to my colleague Mr. Sharma in Strategy; here is his number.", "context": "Internal warm referral with direct phone number"},
            {"quote": "Just send it, if interesting we will call you back.", "context": "Low-commitment polite exit"}
        ],
        "taps": [
            {"id": "agreed_receive_report", "label": "Agreed to Receive Report", "desc": "Confirmed document delivery via WhatsApp / Email", "color": "emerald"},
            {"id": "specific_time_named", "label": "Specific Callback Scheduled", "desc": "Prospect named exact day and time window", "color": "blue"},
            {"id": "internal_referral", "label": "Colleague Referral Given", "desc": "Provided colleague name and direct contact info", "color": "purple"},
            {"id": "vague_brush_exit", "label": "Vague / Low-Intent Exit", "desc": "'Just send it' without genuine buy-in", "color": "amber"}
        ],
        "default_tap": "agreed_receive_report",
        "next_stage_hint": "Stage 8: Close (End clearly and record what happened)"
    },
    {
        "number": 8,
        "name": "Close",
        "badge": "08",
        "tagline": "End the call clearly and log the honest outcome",
        "purpose": "End the call clearly and record what happened: the outcome, the next step, and the prospect's words from stage 5. The record is what the next call is built on.",
        "caller_focus": "Avoid optimistic logging bias! Log what was actually agreed, not what you wished was agreed.",
        "may_say": [
            {"quote": "Okay Priya, send it on WhatsApp. Thank you, bye.", "context": "Warm closing after agreed action"},
            {"quote": "Please do not call this number again. Remove it from your list.", "context": "Explicit DNC request; must honor immediately"},
            {"quote": "Line dropped / prospect disconnected abruptly.", "context": "Sudden call cutoff mid-sentence"},
            {"quote": "Sure, looking forward to speaking on Thursday at 4 PM.", "context": "Mutually affirmed next step"}
        ],
        "taps": [
            {"id": "next_step_locked", "label": "Next Step Firmly Locked", "desc": "WhatsApp report dispatch or calendar invite set", "color": "emerald"},
            {"id": "nurture_follow_up", "label": "Nurture / Follow-up Later", "desc": "Legitimate interest but delayed timeline", "color": "blue"},
            {"id": "unqualified_dnc", "label": "Unqualified / Do Not Call", "desc": "MNC captive, wrong fit, or explicit refusal", "color": "red"},
            {"id": "abrupt_disconnect", "label": "Line Dropped / Abrupt Cut", "desc": "Call dropped mid-sentence; verify line", "color": "amber"}
        ],
        "default_tap": "next_step_locked",
        "next_stage_hint": "Call Completed · Save Record to Database"
    }
]

OUTCOME_DEFINITIONS = [
    {"value": "agreed_to_receive_report", "label": "Agreed to Receive Report", "desc": "The prospect agreed to receive a document, on WhatsApp or email"},
    {"value": "next_step_agreed", "label": "Next Step Agreed", "desc": "A meeting, a call at a set time, or a report plus a follow-up call was agreed"},
    {"value": "interested", "label": "Interested", "desc": "The prospect said they were interested, without a fixed next step"},
    {"value": "follow_up", "label": "Follow Up", "desc": "The caller is to call again (callback requested or check-in)"},
    {"value": "call_again", "label": "Call Again", "desc": "The number is to be called again, often because of language or line quality"},
    {"value": "not_interested", "label": "Not Interested", "desc": "The prospect declined clearly"},
    {"value": "do_not_call", "label": "Do Not Call", "desc": "The prospect asked not to be called, or caller judged it so"},
    {"value": "wrong_person", "label": "Wrong Person", "desc": "The person reached was not the person listed or not the right person"},
    {"value": "moved_company", "label": "Moved Company", "desc": "The person no longer works at the listed company"},
    {"value": "not_logged", "label": "Not Logged", "desc": "Caller logged nothing for this call"}
]
