import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone
import logging

logger = logging.getLogger("coldcall.database")
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
SQLITE_PATH = os.path.join(os.path.dirname(__file__), "coldcall.db")

def is_postgres():
    return bool(DATABASE_URL and DATABASE_URL.startswith("postgres"))

def get_connection():
    if is_postgres():
        try:
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            return conn, "postgres"
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite.")
    
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn, "sqlite"

def seed_initial_calls(cursor, db_type):
    """Seed authentic calls from transcripts T001, T003, T043, T081, T088."""
    now_str = datetime.now(timezone.utc).isoformat()
    
    sample_calls = [
        (
            'call-T001', 'Dev Sharma', 'Technical Services Director', 'Kalpana Chem Supplies (fictional)', 'mid-size private company', 'Priya, Meridian Growth Partners',
            '+91 98201 44102', 'completed', 8, 8, 'next_step_agreed', 75,
            'Reviewing operational cost overruns across chemical processing units.',
            'Follow-up call on Thursday 4:00 PM with detailed diagnostic breakdown.',
            'Prospect reviewed the shared teaser report and acknowledged operational cost concerns. Follow-up meeting locked for Thursday.',
            'next_step_agreed',
            'Hi Dev ji, Priya here from Meridian Growth Partners. As agreed, locking in our follow-up call for Thursday at 4 PM to discuss chemical processing optimizations. Looking forward!',
            now_str, now_str
        ),
        (
            'call-T003', 'Manpreet Singh', 'Associate Director', 'Novara Foods India (fictional)', 'India arm of a multinational', 'Priya, Meridian Growth Partners',
            '+91 98110 33819', 'completed', 6, 6, 'do_not_call', 34,
            None,
            'Marked as Do Not Call - offshore captive back-office unit.',
            'Prospect clarified that India office is strictly a shared-service back office. Growth decisions handled entirely at global HQ.',
            'do_not_call',
            None,
            now_str, now_str
        ),
        (
            'call-T043', 'Kiran Patel', 'Sales Director', 'Sunrise Dye-Chem (fictional)', 'mid-size private manufacturer', 'Arjun, Meridian Growth Partners',
            '+91 98450 71204', 'completed', 5, 5, 'not_interested', 135,
            'Actually, I am not an exporter anymore. I am currently dealing in India only, and the clients I work with are very old relations. Otherwise, I do not have any particular need to find new customers.',
            'None. Exporter thesis was invalid. Domestic relationship-driven business.',
            'Prospect exited export business. Operates on longstanding legacy accounts with zero active acquisition needs.',
            'not_interested',
            None,
            now_str, now_str
        ),
        (
            'call-T081', 'Dr. Raghuveer Varma', 'Chief Executive Officer', 'Cyra Pharma (fictional)', 'listed Indian company', 'Divya, Meridian Growth Partners',
            '+91 94440 18832', 'completed', 7, 7, 'interested', 240,
            'Clientele at this moment is government only. Not sure how well you can research tender procurement to add value.',
            'Send government healthcare procurement case study on WhatsApp.',
            'Strong initial curiosity from CEO. High sensitivity to public sector tender compliance. Shared WhatsApp dossier requested.',
            'interested',
            'Hello Dr. Varma, Divya from Meridian Growth Partners. Sharing our case note on public health supply chain optimization as discussed. Best regards.',
            now_str, now_str
        ),
        (
            'call-T088', 'Siddharth Roy', 'Head of Operational Excellence', 'Zenith Logistics International (fictional)', 'India arm of a multinational', 'Priya, Meridian Growth Partners',
            '+91 97170 59281', 'completed', 6, 6, 'not_interested', 95,
            'All consulting partners are contracted centrally through Singapore headquarters.',
            'None. Single global vendor mandate blocker.',
            'Blocked by global procurement mandate. Local India management has no discretionary consulting budget.',
            'not_interested',
            None,
            now_str, now_str
        )
    ]
    
    query = """
        INSERT INTO calls (
            id, prospect_name, prospect_role, company, company_kind, caller_name,
            phone, status, current_stage, stage_reached, outcome, duration_seconds,
            stage_5_need_verbatim, next_step_details, ai_summary, ai_recommended_outcome,
            whatsapp_draft, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """ if db_type == "sqlite" else """
        INSERT INTO calls (
            id, prospect_name, prospect_role, company, company_kind, caller_name,
            phone, status, current_stage, stage_reached, outcome, duration_seconds,
            stage_5_need_verbatim, next_step_details, ai_summary, ai_recommended_outcome,
            whatsapp_draft, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    cursor.executemany(query, sample_calls)
    
    # Sample stages for call-T001
    sample_stages = [
        ('stg-1', 'call-T001', 1, 'Opening', 'Direct Connect', 'Aha, Priya ji. Hello.', 'Establish warm rapport immediately; acknowledge previous report touchpoint.', now_str, now_str),
        ('stg-2', 'call-T001', 2, 'Purpose', 'Purpose Understood', 'Yeah, I saw that report you sent across.', 'Anchor to concrete metric from teaser report.', now_str, now_str),
        ('stg-3', 'call-T001', 3, 'Permission', 'Clear Yes (Go Ahead)', 'Ah yes, go ahead.', 'Respect time limit; transition directly to business questions.', now_str, now_str),
        ('stg-4', 'call-T001', 4, 'Their business', 'Shared Operations & Scope', 'We have been operating the Bharuch plant at full stretch.', 'Probe on secondary unit bottlenecks.', now_str, now_str),
        ('stg-5', 'call-T001', 5, 'Their need, in their words', 'Voiced Concrete Need / Goal', 'Reviewing operational cost overruns across chemical processing units.', 'Reflect exact words back: "cost overruns across processing units".', now_str, now_str),
        ('stg-7', 'call-T001', 7, 'Next step', 'Specific Callback Scheduled', 'Thursday around 4 PM works best for me.', 'Lock in calendar invite and WhatsApp reminder.', now_str, now_str),
        ('stg-8', 'call-T001', 8, 'Close', 'Next Step Firmly Locked', 'Great, speak to you Thursday Priya ji.', 'Confirm receipt of WhatsApp invite.', now_str, now_str)
    ]
    
    stg_query = """
        INSERT INTO call_stages (
            id, call_id, stage_number, stage_name, tap_result, prospect_words, ai_suggestion, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """ if db_type == "sqlite" else """
        INSERT INTO call_stages (
            id, call_id, stage_number, stage_name, tap_result, prospect_words, ai_suggestion, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(stg_query, sample_stages)

def init_db():
    """Initializes tables and populates sample seeds if empty."""
    conn, db_type = get_connection()
    cursor = conn.cursor()
    
    try:
        if db_type == "postgres":
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS calls (
                    id VARCHAR(64) PRIMARY KEY,
                    prospect_name VARCHAR(255) NOT NULL,
                    prospect_role VARCHAR(255),
                    company VARCHAR(255) NOT NULL,
                    company_kind VARCHAR(100),
                    caller_name VARCHAR(100) DEFAULT 'Priya, Meridian Growth Partners',
                    phone VARCHAR(50),
                    status VARCHAR(50) DEFAULT 'completed',
                    current_stage INT DEFAULT 1,
                    stage_reached INT DEFAULT 1,
                    outcome VARCHAR(100) DEFAULT 'not_logged',
                    duration_seconds INT DEFAULT 0,
                    stage_5_need_verbatim TEXT,
                    next_step_details TEXT,
                    ai_summary TEXT,
                    ai_recommended_outcome VARCHAR(100),
                    whatsapp_draft TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS call_stages (
                    id VARCHAR(64) PRIMARY KEY,
                    call_id VARCHAR(64) NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
                    stage_number INT NOT NULL,
                    stage_name VARCHAR(100) NOT NULL,
                    tap_result VARCHAR(255),
                    prospect_words TEXT,
                    ai_suggestion TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    CONSTRAINT unique_call_stage UNIQUE (call_id, stage_number)
                );
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS calls (
                    id TEXT PRIMARY KEY,
                    prospect_name TEXT NOT NULL,
                    prospect_role TEXT,
                    company TEXT NOT NULL,
                    company_kind TEXT,
                    caller_name TEXT DEFAULT 'Priya, Meridian Growth Partners',
                    phone TEXT,
                    status TEXT DEFAULT 'completed',
                    current_stage INTEGER DEFAULT 1,
                    stage_reached INTEGER DEFAULT 1,
                    outcome TEXT DEFAULT 'not_logged',
                    duration_seconds INTEGER DEFAULT 0,
                    stage_5_need_verbatim TEXT,
                    next_step_details TEXT,
                    ai_summary TEXT,
                    ai_recommended_outcome TEXT,
                    whatsapp_draft TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS call_stages (
                    id TEXT PRIMARY KEY,
                    call_id TEXT NOT NULL,
                    stage_number INTEGER NOT NULL,
                    stage_name TEXT NOT NULL,
                    tap_result TEXT,
                    prospect_words TEXT,
                    ai_suggestion TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(call_id, stage_number),
                    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
                );
            """)
            
        conn.commit()
        
        # Check if calls table has seed data
        cursor.execute("SELECT COUNT(*) as cnt FROM calls;")
        row = cursor.fetchone()
        count = row["cnt"] if isinstance(row, dict) or hasattr(row, "keys") else row[0]
        
        if count == 0:
            seed_initial_calls(cursor, db_type)
            conn.commit()
            
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        conn.rollback()
    finally:
        conn.close()

# Auto-initialize DB on import
try:
    init_db()
except Exception as e:
    logger.warning(f"Could not auto-initialize database on import: {e}")

def fetch_calls(stage=None, outcome=None, search=None, limit=50):
    conn, db_type = get_connection()
    cursor = conn.cursor()
    params = []
    where_clauses = []
    
    if stage:
        where_clauses.append("stage_reached = ?" if db_type == "sqlite" else "stage_reached = %s")
        params.append(stage)
    if outcome:
        where_clauses.append("outcome = ?" if db_type == "sqlite" else "outcome = %s")
        params.append(outcome)
    if search:
        clause = "(company LIKE ? OR prospect_name LIKE ?)" if db_type == "sqlite" else "(company ILIKE %s OR prospect_name ILIKE %s)"
        where_clauses.append(clause)
        params.extend([f"%{search}%", f"%{search}%"])
        
    where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    query = f"SELECT * FROM calls {where_str} ORDER BY created_at DESC LIMIT {limit};"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    result = []
    for r in rows:
        d = dict(r)
        result.append(d)
        
    conn.close()
    return result

def fetch_call_by_id(call_id):
    conn, db_type = get_connection()
    cursor = conn.cursor()
    
    q_call = "SELECT * FROM calls WHERE id = ?;" if db_type == "sqlite" else "SELECT * FROM calls WHERE id = %s;"
    cursor.execute(q_call, (call_id,))
    call_row = cursor.fetchone()
    
    if not call_row:
        conn.close()
        return None
        
    call = dict(call_row)
    
    q_stages = "SELECT * FROM call_stages WHERE call_id = ? ORDER BY stage_number ASC;" if db_type == "sqlite" else "SELECT * FROM call_stages WHERE call_id = %s ORDER BY stage_number ASC;"
    cursor.execute(q_stages, (call_id,))
    stage_rows = cursor.fetchall()
    call["stages"] = [dict(s) for s in stage_rows]
    
    conn.close()
    return call

def insert_call(call_data):
    conn, db_type = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()
    
    cid = call_data.get("id") or f"call-{int(datetime.now().timestamp() * 1000)}"
    p_name = call_data.get("prospect_name", "Prospect")
    p_role = call_data.get("prospect_role", "Executive")
    company = call_data.get("company", "Company")
    company_kind = call_data.get("company_kind", "mid-size private company")
    caller = call_data.get("caller_name", "Priya, Meridian Growth Partners")
    phone = call_data.get("phone", "")
    
    q = """
        INSERT INTO calls (
            id, prospect_name, prospect_role, company, company_kind, caller_name,
            phone, status, current_stage, stage_reached, outcome, duration_seconds,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """ if db_type == "sqlite" else """
        INSERT INTO calls (
            id, prospect_name, prospect_role, company, company_kind, caller_name,
            phone, status, current_stage, stage_reached, outcome, duration_seconds,
            created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    cursor.execute(q, (
        cid, p_name, p_role, company, company_kind, caller, phone,
        "in_progress", 1, 1, "not_logged", 0, now_str, now_str
    ))
    conn.commit()
    conn.close()
    return fetch_call_by_id(cid)

def save_stage_record(call_id, stage_data):
    conn, db_type = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()
    
    stg_num = stage_data.get("stage_number")
    stg_name = stage_data.get("stage_name", f"Stage {stg_num}")
    tap_res = stage_data.get("tap_result", "")
    words = stage_data.get("prospect_words", "")
    ai_sug = stage_data.get("ai_suggestion", "")
    sid = f"stg-{call_id}-{stg_num}"
    
    if db_type == "sqlite":
        cursor.execute("""
            INSERT INTO call_stages (id, call_id, stage_number, stage_name, tap_result, prospect_words, ai_suggestion, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(call_id, stage_number) DO UPDATE SET
                tap_result = excluded.tap_result,
                prospect_words = excluded.prospect_words,
                ai_suggestion = excluded.ai_suggestion,
                updated_at = excluded.updated_at;
        """, (sid, call_id, stg_num, stg_name, tap_res, words, ai_sug, now_str, now_str))
        
        cursor.execute("""
            UPDATE calls SET
                current_stage = ?,
                stage_reached = MAX(stage_reached, ?),
                updated_at = ?
            WHERE id = ?;
        """, (stg_num, stg_num, now_str, call_id))
        
        if stg_num == 5 and words:
            cursor.execute("UPDATE calls SET stage_5_need_verbatim = ? WHERE id = ?;", (words, call_id))
    else:
        cursor.execute("""
            INSERT INTO call_stages (id, call_id, stage_number, stage_name, tap_result, prospect_words, ai_suggestion, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT(call_id, stage_number) DO UPDATE SET
                tap_result = EXCLUDED.tap_result,
                prospect_words = EXCLUDED.prospect_words,
                ai_suggestion = EXCLUDED.ai_suggestion,
                updated_at = EXCLUDED.updated_at;
        """, (sid, call_id, stg_num, stg_name, tap_res, words, ai_sug, now_str, now_str))
        
        cursor.execute("""
            UPDATE calls SET
                current_stage = %s,
                stage_reached = GREATEST(stage_reached, %s),
                updated_at = %s
            WHERE id = %s;
        """, (stg_num, stg_num, now_str, call_id))
        
        if stg_num == 5 and words:
            cursor.execute("UPDATE calls SET stage_5_need_verbatim = %s WHERE id = %s;", (words, call_id))
            
    conn.commit()
    conn.close()
    return fetch_call_by_id(call_id)

def finalize_call(call_id, close_data):
    conn, db_type = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()
    
    outcome = close_data.get("outcome", "not_logged")
    duration = close_data.get("duration_seconds", 0)
    stage_reached = close_data.get("stage_reached", 8)
    next_step = close_data.get("next_step_details", "")
    need_verbatim = close_data.get("stage_5_need_verbatim", "")
    summary = close_data.get("ai_summary", "")
    recommended_outcome = close_data.get("ai_recommended_outcome", "")
    whatsapp = close_data.get("whatsapp_draft", "")
    
    q = """
        UPDATE calls SET
            status = 'completed',
            outcome = ?,
            duration_seconds = ?,
            stage_reached = ?,
            next_step_details = ?,
            stage_5_need_verbatim = COALESCE(?, stage_5_need_verbatim),
            ai_summary = ?,
            ai_recommended_outcome = ?,
            whatsapp_draft = ?,
            updated_at = ?
        WHERE id = ?;
    """ if db_type == "sqlite" else """
        UPDATE calls SET
            status = 'completed',
            outcome = %s,
            duration_seconds = %s,
            stage_reached = %s,
            next_step_details = %s,
            stage_5_need_verbatim = COALESCE(%s, stage_5_need_verbatim),
            ai_summary = %s,
            ai_recommended_outcome = %s,
            whatsapp_draft = %s,
            updated_at = %s
        WHERE id = %s;
    """
    
    cursor.execute(q, (
        outcome, duration, stage_reached, next_step, need_verbatim,
        summary, recommended_outcome, whatsapp, now_str, call_id
    ))
    conn.commit()
    conn.close()
    return fetch_call_by_id(call_id)
