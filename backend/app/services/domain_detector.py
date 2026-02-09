"""
Domain Detection Service
Automatically detects the professional domain from resume and job description content.
"""

import re
from typing import Dict, Tuple

# Domain keyword mappings with weighted importance
DOMAIN_KEYWORDS = {
    'technology': {
        'high': ['software engineer', 'software developer', 'web developer', 'programmer', 'coding', 
                 'api', 'database', 'cloud computing', 'frontend developer', 'backend developer', 
                 'devops', 'algorithm', 'git', 'docker', 'kubernetes', 'react', 'python', 'java', 'javascript'],
        'medium': ['software', 'application development', 'web', 'mobile app', 'server', 'network security',
                   'data science', 'machine learning', 'ai', 'automation', 'agile', 'scrum'],
        'low': ['technology', 'digital', 'platform', 'integration', 'deployment', 'tech stack']
    },
    'healthcare': {
        'high': ['medical', 'patient', 'clinical', 'doctor', 'nurse', 'physician', 'healthcare',
                 'diagnosis', 'treatment', 'hospital', 'clinic', 'surgery', 'pharmacy', 'nursing'],
        'medium': ['health', 'care', 'medicine', 'therapeutic', 'diagnostic', 'medical device',
                   'hipaa', 'ehr', 'emr', 'radiology', 'pathology'],
        'low': ['wellness', 'rehabilitation', 'preventive', 'outpatient', 'inpatient']
    },
    'construction': {
        'high': ['civil engineer', 'structural engineer', 'construction engineer', 'building construction', 
                 'architect', 'contractor', 'site engineer', 'project engineer', 'quantity surveyor',
                 'blueprint', 'construction site', 'superintendent', 'autocad', 'revit'],
        'medium': ['construction', 'infrastructure', 'foundation', 'concrete', 'steel structure',
                   'hvac', 'electrical systems', 'plumbing', 'construction safety', 'osha', 'surveying'],
        'low': ['renovation', 'commercial building', 'residential', 'industrial', 'building permit', 'civil']
    },
    'finance': {
        'high': ['financial analyst', 'accountant', 'investment', 'banking', 'audit', 'portfolio',
                 'cpa', 'cfa', 'trader', 'wealth management', 'financial planning'],
        'medium': ['finance', 'budget', 'tax', 'revenue', 'profit', 'loss', 'balance sheet',
                   'income statement', 'cash flow', 'gaap', 'sox', 'compliance'],
        'low': ['fiscal', 'monetary', 'economic', 'capital', 'asset', 'liability']
    },
    'education': {
        'high': ['teacher', 'educator', 'curriculum', 'student', 'classroom', 'pedagogy',
                 'instructor', 'professor', 'tutor', 'teaching', 'learning'],
        'medium': ['academic', 'school', 'university', 'college', 'lesson', 'assessment',
                   'grading', 'iep', 'special education', 'literacy'],
        'low': ['educational', 'training', 'workshop', 'seminar', 'course']
    },
    'legal': {
        'high': ['legal', 'law', 'attorney', 'lawyer', 'contract law', 'compliance', 'litigation',
                 'paralegal', 'counsel', 'court', 'case law', 'statute'],
        'medium': ['regulatory', 'legislation', 'policy', 'agreement', 'dispute', 'arbitration',
                   'intellectual property', 'patent', 'trademark', 'corporate law'],
        'low': ['legal research', 'brief', 'motion', 'deposition', 'discovery']
    },
    'marketing': {
        'high': ['marketing', 'brand manager', 'campaign', 'seo', 'content marketing', 'digital marketing',
                 'social media marketing', 'advertising', 'promotion', 'market research'],
        'medium': ['branding', 'positioning', 'segmentation', 'targeting', 'analytics', 'roi',
                   'conversion', 'engagement', 'lead generation', 'email marketing'],
        'low': ['outreach', 'awareness', 'visibility', 'reach', 'impression']
    },
    'sales': {
        'high': ['sales', 'sales representative', 'account executive', 'business development', 
                 'pipeline', 'negotiation', 'closing deals', 'quota', 'crm', 'account manager'],
        'medium': ['selling', 'prospect', 'lead', 'opportunity', 'deal', 'customer', 'relationship',
                   'retention', 'upsell', 'cross-sell'],
        'low': ['commission', 'target', 'forecast', 'territory', 'outbound']
    }
}

# Weight multipliers
WEIGHTS = {
    'high': 3.0,
    'medium': 2.0,
    'low': 1.0
}

def normalize_text(text: str) -> str:
    """Normalize text for keyword matching"""
    if not text:
        return ""
    # Convert to lowercase and remove extra whitespace
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    return text

def calculate_domain_scores(text: str) -> Dict[str, float]:
    """Calculate weighted scores for each domain based on keyword matches"""
    normalized_text = normalize_text(text)
    scores = {domain: 0.0 for domain in DOMAIN_KEYWORDS.keys()}
    
    for domain, keyword_groups in DOMAIN_KEYWORDS.items():
        for weight_level, keywords in keyword_groups.items():
            weight = WEIGHTS[weight_level]
            for keyword in keywords:
                # Use word boundary matching for better accuracy
                # Count occurrences with word boundaries to avoid partial matches
                pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
                matches = re.findall(pattern, normalized_text)
                count = len(matches)
                scores[domain] += count * weight
    
    return scores

def detect_domain(resume_text: str, jd_text: str) -> Tuple[str, float]:
    """
    Detect the professional domain from resume and job description.
    
    Args:
        resume_text: Resume content
        jd_text: Job description content
    
    Returns:
        Tuple of (domain_slug, confidence_score)
    """
    # Combine texts with higher weight on JD (job posting is more specific)
    combined_text = f"{jd_text} {jd_text} {resume_text}"
    
    # Calculate scores
    scores = calculate_domain_scores(combined_text)
    
    # Find domain with highest score
    if not scores or max(scores.values()) == 0:
        # Default to technology if no matches
        return 'technology', 0.3
    
    top_domain = max(scores, key=scores.get)
    top_score = scores[top_domain]
    
    # Calculate confidence (normalize to 0-1 range)
    total_score = sum(scores.values())
    confidence = top_score / total_score if total_score > 0 else 0.3
    
    # Ensure minimum confidence threshold
    if confidence < 0.4:
        # If confidence is low, default to technology
        return 'technology', confidence
    
    return top_domain, confidence

def get_domain_keywords(domain_slug: str) -> list:
    """Get all keywords for a specific domain"""
    if domain_slug not in DOMAIN_KEYWORDS:
        return []
    
    keywords = []
    for keyword_list in DOMAIN_KEYWORDS[domain_slug].values():
        keywords.extend(keyword_list)
    return keywords
