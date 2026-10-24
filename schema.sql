-- ==============================================================================
-- Cold Call Screen - Supabase / PostgreSQL Schema
-- Company Context: Meridian Growth Partners (Hyderabad, India)
-- Author: Forward Deployed Engineering Build
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: calls
-- Stores high-level call metadata, caller, prospect, outcome, duration, and AI analysis.
CREATE TABLE IF NOT EXISTS calls (
    id VARCHAR(64) PRIMARY KEY,
    prospect_name VARCHAR(255) NOT NULL,
    prospect_role VARCHAR(255),
    company VARCHAR(255) NOT NULL,
    company_kind VARCHAR(100),
    caller_name VARCHAR(100) DEFAULT 'Priya, Meridian Growth Partners',
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'completed', -- 'in_progress', 'completed', 'dropped'
    current_stage INT DEFAULT 1,
    stage_reached INT DEFAULT 1,
    outcome VARCHAR(100) DEFAULT 'not_logged',
    -- Outcome values match the 10 transcript categories:
    -- 'agreed_to_receive_report', 'next_step_agreed', 'interested', 'follow_up',
    -- 'call_again', 'not_interested', 'do_not_call', 'wrong_person', 'moved_company', 'not_logged'
    duration_seconds INT DEFAULT 0,
    stage_5_need_verbatim TEXT,
    next_step_details TEXT,
    ai_summary TEXT,
    ai_recommended_outcome VARCHAR(100),
    whatsapp_draft TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: call_stages
-- Records granular what happened at each of the 8 call stages, plus prospect verbatim and AI suggestions.
CREATE TABLE IF NOT EXISTS call_stages (
    id VARCHAR(64) PRIMARY KEY,
    call_id VARCHAR(64) NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    stage_number INT NOT NULL, -- 1 through 8
    stage_name VARCHAR(100) NOT NULL,
    tap_result VARCHAR(255), -- The one-tap choice (e.g. 'Direct Connect', 'MNC Global Mandate')
    prospect_words TEXT,     -- Prospect's own words at this specific stage
    ai_suggestion TEXT,      -- Rebuttal, probe, or coaching delivered at this stage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_call_stage UNIQUE (call_id, stage_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome);
CREATE INDEX IF NOT EXISTS idx_calls_stage_reached ON calls(stage_reached);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_company ON calls(company);
CREATE INDEX IF NOT EXISTS idx_call_stages_call_id ON call_stages(call_id);

-- ==============================================================================
-- Sample Seed Data (From Real Meridian Growth Partners Transcripts T001, T003, T043, T081, T088)
-- ==============================================================================

INSERT INTO calls (
    id, prospect_name, prospect_role, company, company_kind, caller_name,
    status, current_stage, stage_reached, outcome, duration_seconds,
    stage_5_need_verbatim, next_step_details, ai_summary, whatsapp_draft, created_at
) VALUES
(
    'call-T001', 'Dev Sharma', 'Technical Services Director', 'Kalpana Chem Supplies (fictional)', 'mid-size private company', 'Priya, Meridian Growth Partners',
    'completed', 8, 8, 'next_step_agreed', 75,
    'Reviewing operational cost overruns across chemical processing units.',
    'Follow-up call on Thursday 4:00 PM with detailed diagnostic breakdown.',
    'Prospect reviewed the shared teaser report and acknowledged operational cost concerns. Follow-up meeting locked for Thursday.',
    'Hi Dev ji, Priya here from Meridian. As agreed, locking in our follow-up call for Thursday at 4 PM to discuss chemical processing optimizations. Looking forward!',
    NOW() - INTERVAL '2 hours'
),
(
    'call-T003', 'Manpreet Singh', 'Associate Director', 'Novara Foods India (fictional)', 'India arm of a multinational', 'Priya, Meridian Growth Partners',
    'completed', 6, 6, 'do_not_call', 34,
    NULL,
    'Marked as Do Not Call - offshore captive unit.',
    'Prospect clarified that India office is strictly a shared-service back office. Growth decisions handled entirely at global HQ.',
    NULL,
    NOW() - INTERVAL '5 hours'
),
(
    'call-T043', 'Kiran Patel', 'Sales Director', 'Sunrise Dye-Chem (fictional)', 'mid-size private manufacturer', 'Arjun, Meridian Growth Partners',
    'completed', 5, 5, 'not_interested', 135,
    'Actually, I am not an exporter anymore. I am currently dealing in India only, and the clients I work with are very old relations. Otherwise, I do not have any particular need to find new customers.',
    'None. Exporter thesis was invalid. Domestic relationship-driven business.',
    'Prospect exited export business. Operates on longstanding legacy accounts with zero active acquisition needs.',
    NULL,
    NOW() - INTERVAL '1 day'
),
(
    'call-T081', 'Dr. Raghuveer Varma', 'Chief Executive Officer', 'Cyra Pharma (fictional)', 'listed Indian company', 'Divya, Meridian Growth Partners',
    'completed', 7, 7, 'interested', 240,
    'Clientele at this moment is government only. Not sure how well you can research tender procurement to add value.',
    'Send government healthcare procurement case study on WhatsApp.',
    'Strong initial curiosity from CEO. High sensitivity to public sector tender compliance. Shared WhatsApp dossier requested.',
    'Hello Dr. Varma, Divya from Meridian Growth Partners. Sharing our case note on public health supply chain optimization as discussed. Best regards.',
    NOW() - INTERVAL '1 day 3 hours'
),
(
    'call-T088', 'Siddharth Roy', 'Head of Operational Excellence', 'Zenith Logistics International (fictional)', 'India arm of a multinational', 'Priya, Meridian Growth Partners',
    'completed', 6, 6, 'not_interested', 95,
    'All consulting partners are contracted centrally through Singapore headquarters.',
    'None. Single global vendor mandate blocker.',
    'Blocked by global procurement mandate. Local India management has no discretionary consulting budget.',
    NULL,
    NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- Seed stages for call-T001
INSERT INTO call_stages (id, call_id, stage_number, stage_name, tap_result, prospect_words, ai_suggestion) VALUES
('stg-T001-1', 'call-T001', 1, 'Opening', 'Direct Connect', 'Aha, Priya ji. Hello.', 'Establish warm rapport immediately; acknowledge previous report touchpoint.'),
('stg-T001-2', 'call-T001', 2, 'Purpose', 'Purpose Understood', 'Yeah, I saw that report you sent across.', 'Anchor to concrete metric from teaser report.'),
('stg-T001-3', 'call-T001', 3, 'Permission', 'Clear Yes (Talking)', 'Ah yes, go ahead.', 'Respect time limit; transition directly to business questions.'),
('stg-T001-4', 'call-T001', 4, 'Their business', 'Shared Operations & Scale', 'We have been operating the Bharuch plant at full stretch.', 'Probe on secondary unit bottlenecks.'),
('stg-T001-5', 'call-T001', 5, 'Their need, in their words', 'Articulated Concrete Need', 'Reviewing operational cost overruns across chemical processing units.', 'Reflect exact words back: "cost overruns across processing units".'),
('stg-T001-7', 'call-T001', 7, 'Next step', 'Specific Callback Scheduled', 'Thursday around 4 PM works best for me.', 'Lock in calendar invite and WhatsApp reminder.'),
('stg-T001-8', 'call-T001', 8, 'Close', 'Actionable Next Step Logged', 'Great, speak to you Thursday Priya ji.', 'Confirm receipt of WhatsApp invite.')
ON CONFLICT (id) DO NOTHING;
