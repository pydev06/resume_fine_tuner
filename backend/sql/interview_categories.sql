-- Drop existing table if it exists (to fix schema issues)
DROP TABLE IF EXISTS interview_categories CASCADE;

-- Interview Categories Table
CREATE TABLE interview_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- lucide icon name
    color VARCHAR(20), -- hex color for UI
    gradient VARCHAR(100), -- tailwind gradient classes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed initial categories
INSERT INTO interview_categories (name, slug, description, icon, color, gradient) VALUES
('Data Structures & Algorithms', 'dsa', 'Coding problems, algorithmic thinking, and complexity analysis', 'Code2', '#6366f1', 'from-indigo-500 to-blue-600'),
('System Design', 'system-design', 'Architecture, scalability, and trade-off discussions', 'Network', '#8b5cf6', 'from-purple-500 to-violet-600'),
('DevOps & Infrastructure', 'devops', 'CI/CD, containers, cloud platforms, and monitoring', 'Server', '#ec4899', 'from-pink-500 to-rose-600'),
('Backend Development', 'backend', 'APIs, databases, authentication, and server-side logic', 'Database', '#10b981', 'from-emerald-500 to-green-600'),
('Frontend Development', 'frontend', 'UI/UX, frameworks, state management, and performance', 'Layout', '#f59e0b', 'from-amber-500 to-orange-600'),
('Behavioral & Leadership', 'behavioral', 'Soft skills, team dynamics, and conflict resolution', 'Users', '#06b6d4', 'from-cyan-500 to-teal-600'),
('Generic', 'generic', 'Mixed technical and behavioral based on your profile', 'Sparkles', '#64748b', 'from-slate-500 to-gray-600')
ON CONFLICT (slug) DO NOTHING;

-- Update interview_sessions table to include category
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES interview_categories(id),
ADD COLUMN IF NOT EXISTS category_slug VARCHAR(50);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_category ON interview_sessions(category_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_category_slug ON interview_sessions(category_slug);

-- Set default category for existing sessions
UPDATE interview_sessions 
SET category_slug = 'generic', 
    category_id = (SELECT id FROM interview_categories WHERE slug = 'generic')
WHERE category_slug IS NULL;
