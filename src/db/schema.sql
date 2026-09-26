CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    job_title VARCHAR(255),
    website VARCHAR(255),
    budget NUMERIC,
    timeline VARCHAR(100),
    industry VARCHAR(100),
    message TEXT NOT NULL,
    
    -- AI Generated fields
    score INTEGER,
    category VARCHAR(20),     -- 'Hot', 'Warm', or 'Cold'
    summary TEXT,
    need TEXT,
    intent VARCHAR(50),
    ai_raw_response JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast queries by category on the dashboard
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);

-- Index for ordering leads by recency
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);