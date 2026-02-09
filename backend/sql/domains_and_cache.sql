-- =====================================================
-- Domain-Aware Categories & AI Caching Migration
-- =====================================================

-- 1. Create Domains Table
-- =====================================================
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- lucide icon name
    color VARCHAR(20), -- hex color
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Seed Professional Domains
-- =====================================================
INSERT INTO domains (name, slug, description, icon, color, sort_order) VALUES
('Technology', 'technology', 'Software development, IT, and engineering roles', 'Code2', '#6366f1', 1),
('Healthcare', 'healthcare', 'Medical, nursing, pharmacy, and healthcare services', 'Heart', '#ef4444', 2),
('Construction', 'construction', 'Civil engineering, architecture, and project management', 'HardHat', '#f97316', 3),
('Finance', 'finance', 'Banking, accounting, investment, and financial services', 'DollarSign', '#10b981', 4),
('Education', 'education', 'Teaching, administration, and educational services', 'GraduationCap', '#8b5cf6', 5),
('Legal', 'legal', 'Law, compliance, and legal services', 'Scale', '#0ea5e9', 6),
('Marketing', 'marketing', 'Digital marketing, brand management, and content creation', 'Megaphone', '#ec4899', 7),
('Sales', 'sales', 'Business development, account management, and sales', 'TrendingUp', '#14b8a6', 8)
ON CONFLICT (slug) DO NOTHING;

-- 3. Update Categories Table with Domain Support
-- =====================================================
ALTER TABLE interview_categories 
ADD COLUMN IF NOT EXISTS domain VARCHAR(50) DEFAULT 'technology',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_interview_categories_domain ON interview_categories(domain);

-- Update existing categories to technology domain
UPDATE interview_categories 
SET domain = 'technology' 
WHERE domain = 'technology' OR domain IS NULL;

-- 4. Add Domain-Specific Categories
-- =====================================================

-- HEALTHCARE CATEGORIES
INSERT INTO interview_categories (name, slug, description, icon, color, gradient, domain, sort_order) VALUES
('Clinical Knowledge & Diagnosis', 'clinical-knowledge', 'Medical knowledge, diagnostic skills, and clinical reasoning', 'Stethoscope', '#ef4444', 'from-red-500 to-rose-600', 'healthcare', 1),
('Patient Care & Communication', 'patient-care', 'Patient interaction, bedside manner, and communication skills', 'Users', '#f97316', 'from-orange-500 to-amber-600', 'healthcare', 2),
('Medical Procedures & Protocols', 'medical-procedures', 'Clinical procedures, protocols, and best practices', 'Activity', '#10b981', 'from-emerald-500 to-green-600', 'healthcare', 3),
('Healthcare Regulations & Ethics', 'healthcare-regulations', 'HIPAA, medical ethics, and regulatory compliance', 'Shield', '#8b5cf6', 'from-purple-500 to-violet-600', 'healthcare', 4),
('Emergency Response', 'emergency-response', 'Critical care, emergency protocols, and rapid decision-making', 'AlertCircle', '#dc2626', 'from-red-600 to-rose-700', 'healthcare', 5),
('Healthcare Behavioral', 'healthcare-behavioral', 'Teamwork, stress management, and professional conduct', 'Heart', '#ec4899', 'from-pink-500 to-rose-600', 'healthcare', 6)
ON CONFLICT (slug) DO NOTHING;

-- CONSTRUCTION CATEGORIES
INSERT INTO interview_categories (name, slug, description, icon, color, gradient, domain, sort_order) VALUES
('Structural Design & Analysis', 'structural-design', 'Structural engineering, load calculations, and design principles', 'Box', '#f97316', 'from-orange-500 to-amber-600', 'construction', 1),
('Building Codes & Safety', 'building-codes', 'Building regulations, safety standards, and compliance', 'ShieldCheck', '#dc2626', 'from-red-500 to-rose-600', 'construction', 2),
('Project Management & Planning', 'construction-pm', 'Construction planning, scheduling, and resource management', 'Calendar', '#8b5cf6', 'from-purple-500 to-violet-600', 'construction', 3),
('Material Science & Selection', 'material-science', 'Construction materials, properties, and selection criteria', 'Layers', '#10b981', 'from-emerald-500 to-green-600', 'construction', 4),
('Site Management & Coordination', 'site-management', 'On-site coordination, supervision, and quality control', 'MapPin', '#0ea5e9', 'from-sky-500 to-blue-600', 'construction', 5),
('Construction Behavioral', 'construction-behavioral', 'Leadership, team coordination, and problem-solving', 'Users', '#ec4899', 'from-pink-500 to-rose-600', 'construction', 6)
ON CONFLICT (slug) DO NOTHING;

-- FINANCE CATEGORIES
INSERT INTO interview_categories (name, slug, description, icon, color, gradient, domain, sort_order) VALUES
('Financial Analysis & Modeling', 'financial-analysis', 'Financial statements, modeling, and analysis techniques', 'TrendingUp', '#10b981', 'from-emerald-500 to-green-600', 'finance', 1),
('Risk Management', 'risk-management', 'Risk assessment, mitigation strategies, and compliance', 'Shield', '#dc2626', 'from-red-500 to-rose-600', 'finance', 2),
('Regulatory Compliance', 'finance-compliance', 'Financial regulations, SOX, and compliance requirements', 'FileText', '#8b5cf6', 'from-purple-500 to-violet-600', 'finance', 3),
('Investment Strategies', 'investment-strategies', 'Portfolio management, investment analysis, and strategies', 'BarChart', '#0ea5e9', 'from-sky-500 to-blue-600', 'finance', 4),
('Accounting Principles', 'accounting-principles', 'GAAP, accounting standards, and financial reporting', 'Calculator', '#f97316', 'from-orange-500 to-amber-600', 'finance', 5),
('Finance Behavioral', 'finance-behavioral', 'Ethics, decision-making, and professional conduct', 'Users', '#ec4899', 'from-pink-500 to-rose-600', 'finance', 6)
ON CONFLICT (slug) DO NOTHING;

-- EDUCATION CATEGORIES
INSERT INTO interview_categories (name, slug, description, icon, color, gradient, domain, sort_order) VALUES
('Curriculum Design & Pedagogy', 'curriculum-design', 'Lesson planning, instructional design, and teaching methods', 'BookOpen', '#8b5cf6', 'from-purple-500 to-violet-600', 'education', 1),
('Classroom Management', 'classroom-management', 'Student behavior, classroom organization, and discipline', 'Users', '#f97316', 'from-orange-500 to-amber-600', 'education', 2),
('Student Assessment', 'student-assessment', 'Testing, grading, and evaluating student progress', 'ClipboardCheck', '#10b981', 'from-emerald-500 to-green-600', 'education', 3),
('Educational Technology', 'educational-technology', 'EdTech tools, online learning, and digital resources', 'Monitor', '#0ea5e9', 'from-sky-500 to-blue-600', 'education', 4),
('Special Education & Inclusion', 'special-education', 'Inclusive practices, IEPs, and differentiated instruction', 'Heart', '#ec4899', 'from-pink-500 to-rose-600', 'education', 5),
('Education Behavioral', 'education-behavioral', 'Communication, empathy, and professional development', 'MessageCircle', '#6366f1', 'from-indigo-500 to-blue-600', 'education', 6)
ON CONFLICT (slug) DO NOTHING;

-- LEGAL CATEGORIES
INSERT INTO interview_categories (name, slug, description, icon, color, gradient, domain, sort_order) VALUES
('Legal Research & Analysis', 'legal-research', 'Case law research, legal analysis, and precedent review', 'Search', '#0ea5e9', 'from-sky-500 to-blue-600', 'legal', 1),
('Case Law & Precedents', 'case-law', 'Understanding precedents, case analysis, and legal reasoning', 'FileText', '#8b5cf6', 'from-purple-500 to-violet-600', 'legal', 2),
('Contract Review & Drafting', 'contract-drafting', 'Contract analysis, drafting, and negotiation', 'FileSignature', '#10b981', 'from-emerald-500 to-green-600', 'legal', 3),
('Legal Compliance', 'legal-compliance', 'Regulatory compliance, corporate law, and governance', 'Shield', '#dc2626', 'from-red-500 to-rose-600', 'legal', 4),
('Client Communication', 'legal-communication', 'Client relations, counseling, and communication skills', 'MessageSquare', '#f97316', 'from-orange-500 to-amber-600', 'legal', 5),
('Legal Behavioral', 'legal-behavioral', 'Ethics, professionalism, and conflict resolution', 'Scale', '#ec4899', 'from-pink-500 to-rose-600', 'legal', 6)
ON CONFLICT (slug) DO NOTHING;

-- MARKETING CATEGORIES
INSERT INTO interview_categories (name, slug, description, icon, color, gradient, domain, sort_order) VALUES
('Digital Marketing Strategy', 'digital-marketing', 'SEO, SEM, social media, and digital campaign planning', 'Globe', '#0ea5e9', 'from-sky-500 to-blue-600', 'marketing', 1),
('Brand Management', 'brand-management', 'Brand positioning, identity, and reputation management', 'Award', '#8b5cf6', 'from-purple-500 to-violet-600', 'marketing', 2),
('Content Creation & SEO', 'content-seo', 'Content strategy, copywriting, and search optimization', 'FileText', '#10b981', 'from-emerald-500 to-green-600', 'marketing', 3),
('Analytics & ROI', 'marketing-analytics', 'Marketing metrics, analytics, and ROI measurement', 'BarChart', '#f97316', 'from-orange-500 to-amber-600', 'marketing', 4),
('Campaign Management', 'campaign-management', 'Campaign planning, execution, and optimization', 'Target', '#ec4899', 'from-pink-500 to-rose-600', 'marketing', 5),
('Marketing Behavioral', 'marketing-behavioral', 'Creativity, collaboration, and adaptability', 'Sparkles', '#6366f1', 'from-indigo-500 to-blue-600', 'marketing', 6)
ON CONFLICT (slug) DO NOTHING;

-- SALES CATEGORIES
INSERT INTO interview_categories (name, slug, description, icon, color, gradient, domain, sort_order) VALUES
('Sales Strategy & Planning', 'sales-strategy', 'Sales planning, territory management, and goal setting', 'Target', '#10b981', 'from-emerald-500 to-green-600', 'sales', 1),
('Client Relationship Management', 'crm-skills', 'Building relationships, account management, and retention', 'Users', '#0ea5e9', 'from-sky-500 to-blue-600', 'sales', 2),
('Negotiation & Closing', 'negotiation-closing', 'Deal negotiation, objection handling, and closing techniques', 'Handshake', '#8b5cf6', 'from-purple-500 to-violet-600', 'sales', 3),
('Product Knowledge', 'product-knowledge', 'Product expertise, value proposition, and competitive analysis', 'Package', '#f97316', 'from-orange-500 to-amber-600', 'sales', 4),
('Pipeline Management', 'pipeline-management', 'Sales pipeline, forecasting, and opportunity management', 'TrendingUp', '#14b8a6', 'from-teal-500 to-cyan-600', 'sales', 5),
('Sales Behavioral', 'sales-behavioral', 'Resilience, communication, and relationship building', 'MessageCircle', '#ec4899', 'from-pink-500 to-rose-600', 'sales', 6)
ON CONFLICT (slug) DO NOTHING;

-- 5. Create AI Response Cache Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_response_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    prompt_hash VARCHAR(64) NOT NULL,
    response_data JSONB NOT NULL,
    model VARCHAR(50),
    tokens_used INTEGER,
    cache_type VARCHAR(50), -- 'domain_detection', 'interview_start', 'common_pattern'
    created_at TIMESTAMP DEFAULT NOW(),
    accessed_at TIMESTAMP DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_response_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_type ON ai_response_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_ai_cache_prompt_hash ON ai_response_cache(prompt_hash);

-- 6. Update Interview Sessions with Domain
-- =====================================================
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS domain_slug VARCHAR(50) DEFAULT 'technology';

CREATE INDEX IF NOT EXISTS idx_interview_sessions_domain ON interview_sessions(domain_slug);

-- Set default domain for existing sessions
UPDATE interview_sessions 
SET domain_slug = 'technology' 
WHERE domain_slug IS NULL OR domain_slug = '';

-- 7. Create Cache Cleanup Function (Optional)
-- =====================================================
-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_response_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Verification Queries
-- =====================================================
-- Run these after migration to verify:

-- Check domains
-- SELECT * FROM domains ORDER BY sort_order;

-- Check categories by domain
-- SELECT domain, COUNT(*) as category_count 
-- FROM interview_categories 
-- GROUP BY domain 
-- ORDER BY domain;

-- Check cache table structure
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'ai_response_cache';
