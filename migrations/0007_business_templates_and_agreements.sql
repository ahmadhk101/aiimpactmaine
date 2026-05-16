CREATE TABLE IF NOT EXISTS business_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content_json TEXT NOT NULL,
  source_filename TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_business_templates_type ON business_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_business_templates_name ON business_templates(name);

CREATE TABLE IF NOT EXISTS agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agreement_type TEXT NOT NULL,
  client_id INTEGER,
  engagement_id INTEGER,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  signed_state TEXT NOT NULL DEFAULT 'unsigned',
  effective_date TEXT,
  filename TEXT,
  r2_key TEXT,
  size_bytes INTEGER,
  file_reference TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agreements_client ON agreements(client_id);
CREATE INDEX IF NOT EXISTS idx_agreements_engagement ON agreements(engagement_id);
CREATE INDEX IF NOT EXISTS idx_agreements_type ON agreements(agreement_type);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);

UPDATE business_templates
SET description = 'Editable proposal language, delivery sections, placeholders, pricing blocks, and next steps based on 10_Proposal_Template.docx.',
    content_json = '{"sections":[{"key":"why_this_engagement","label":"Why this engagement","text":"Open with a tailored 2-3 sentence paragraph reflecting what the client said in discovery. Reference their goals, audience, constraints, and language."},{"key":"what_we_deliver","label":"What we will deliver","items":["AI training, audit, advisory, governance, or implementation support as scoped","Supporting materials and documented recommendations","Post-engagement follow-up and next steps"]},{"key":"how_we_work","label":"How we will work together","items":["Kickoff call to confirm scope, audience, and logistics","Pre-engagement preparation and content tailoring","Delivery of sessions, audits, advisory work, or materials","Post-engagement follow-up and digital materials"]},{"key":"investment","label":"Investment","fields":["total_amount","deposit_amount","balance_amount","valid_until"],"payment_schedule":["50% deposit upon contract signature","50% balance upon completion, Net 30","Pre-approved travel and materials billed at cost if applicable"]},{"key":"why_ai_impact_maine","label":"Why AI Impact Maine","items":["Maine-based AI training, audit, and advisory practice","Practical, defensible AI use for regulated and trust-sensitive organizations","Training focused on what teams can use the next morning"]},{"key":"next_steps","label":"Next steps","items":["Review proposal and request adjustments","Approve scope and receive Statement of Work","Begin preparation after signature and deposit"]}],"placeholders":["client_name","engagement_title","date","audience","goals","total_amount","deposit_amount","balance_amount","valid_until"]}',
    source_filename = '10_Proposal_Template.docx',
    updated_at = CURRENT_TIMESTAMP
WHERE template_type = 'proposal' AND name = 'Standard Proposal Template';

INSERT INTO business_templates (template_type, name, description, content_json, source_filename)
SELECT 'proposal', 'Standard Proposal Template',
       'Editable proposal language, delivery sections, placeholders, pricing blocks, and next steps based on 10_Proposal_Template.docx.',
       '{"sections":[{"key":"why_this_engagement","label":"Why this engagement","text":"Open with a tailored 2-3 sentence paragraph reflecting what the client said in discovery. Reference their goals, audience, constraints, and language."},{"key":"what_we_deliver","label":"What we will deliver","items":["AI training, audit, advisory, governance, or implementation support as scoped","Supporting materials and documented recommendations","Post-engagement follow-up and next steps"]},{"key":"how_we_work","label":"How we will work together","items":["Kickoff call to confirm scope, audience, and logistics","Pre-engagement preparation and content tailoring","Delivery of sessions, audits, advisory work, or materials","Post-engagement follow-up and digital materials"]},{"key":"investment","label":"Investment","fields":["total_amount","deposit_amount","balance_amount","valid_until"],"payment_schedule":["50% deposit upon contract signature","50% balance upon completion, Net 30","Pre-approved travel and materials billed at cost if applicable"]},{"key":"why_ai_impact_maine","label":"Why AI Impact Maine","items":["Maine-based AI training, audit, and advisory practice","Practical, defensible AI use for regulated and trust-sensitive organizations","Training focused on what teams can use the next morning"]},{"key":"next_steps","label":"Next steps","items":["Review proposal and request adjustments","Approve scope and receive Statement of Work","Begin preparation after signature and deposit"]}],"placeholders":["client_name","engagement_title","date","audience","goals","total_amount","deposit_amount","balance_amount","valid_until"]}',
       '10_Proposal_Template.docx'
WHERE NOT EXISTS (SELECT 1 FROM business_templates WHERE template_type = 'proposal' AND name = 'Standard Proposal Template');

UPDATE business_templates
SET description = 'Editable invoice terms, line item language, due-date terms, deposit language, and payment placeholders based on 11_Invoice_Template.docx.',
    content_json = '{"line_item_templates":["AI training session","AI audit or readiness assessment","AI governance advisory","Implementation support","Retainer advisory support"],"payment_terms":{"default_due":"Net 30 unless otherwise specified","deposit_language":"50% deposit due upon SOW signature when applicable","prior_payment_language":"Prior payments or deposits should be credited before final balance","late_payment":"Invoices not paid within 30 days may be subject to a late fee of 1.5% per month or the maximum permitted by law."},"payment_instructions":{"ach_wire":"[Bank name, routing number, account number]","check":"Khan Brothers LLC, 30 Danforth Street, Portland, ME 04101","credit_card":"[Stripe payment link]"},"placeholders":["invoice_number","invoice_date","due_date","client_name","engagement_title","line_items","deposit_paid","balance_due","payment_link"]}',
    source_filename = '11_Invoice_Template.docx',
    updated_at = CURRENT_TIMESTAMP
WHERE template_type = 'invoice' AND name = 'Standard Invoice Template';

INSERT INTO business_templates (template_type, name, description, content_json, source_filename)
SELECT 'invoice', 'Standard Invoice Template',
       'Editable invoice terms, line item language, due-date terms, deposit language, and payment placeholders based on 11_Invoice_Template.docx.',
       '{"line_item_templates":["AI training session","AI audit or readiness assessment","AI governance advisory","Implementation support","Retainer advisory support"],"payment_terms":{"default_due":"Net 30 unless otherwise specified","deposit_language":"50% deposit due upon SOW signature when applicable","prior_payment_language":"Prior payments or deposits should be credited before final balance","late_payment":"Invoices not paid within 30 days may be subject to a late fee of 1.5% per month or the maximum permitted by law."},"payment_instructions":{"ach_wire":"[Bank name, routing number, account number]","check":"Khan Brothers LLC, 30 Danforth Street, Portland, ME 04101","credit_card":"[Stripe payment link]"},"placeholders":["invoice_number","invoice_date","due_date","client_name","engagement_title","line_items","deposit_paid","balance_due","payment_link"]}',
       '11_Invoice_Template.docx'
WHERE NOT EXISTS (SELECT 1 FROM business_templates WHERE template_type = 'invoice' AND name = 'Standard Invoice Template');

UPDATE business_templates
SET description = 'Editable speaker bios, session descriptions, and speaker-kit content based on 05_Speaker_Kit.docx and 06_Speaker_Bios.docx.',
    content_json = '{"speaker":"Ahmad Khan","title":"Founder, AI Impact Maine","bios":{"short":"Ahmad Khan is the founder of AI Impact Maine, a Portland-based AI training, audit, and advisory practice helping Maine organizations adopt AI safely and practically.","medium":"Ahmad Khan is the founder of AI Impact Maine, an AI training, audit, and advisory practice based in Portland, Maine. His work helps Maine businesses, nonprofits, municipalities, and housing organizations adopt AI with practical workflows, clear guardrails, and defensible governance.","long":"Ahmad Khan is the founder of AI Impact Maine, an AI training, audit, and advisory practice based in Portland, Maine. Raised in Maine and educated at Gorham High School and the University of Southern Maine, Ahmad brings practical business experience in sales, accounting, documentation, compliance, and communication. He founded AI Impact Maine to help organizations move beyond AI hype and adopt tools safely, responsibly, and usefully."},"first_person":"I help Maine organizations adopt AI safely and practically through training, audits, governance, and advisory support.","sessions":[{"title":"AI for Housing Professionals: What Actually Works","format":"Opening keynote","length":"60 minutes"},{"title":"AI for Property Management Operations","format":"Hands-on workshop","length":"75 minutes"},{"title":"AI for Resident Services and Compliance","format":"Hands-on workshop","length":"75 minutes"},{"title":"AI for Executives and Boards","format":"Strategic discussion","length":"60 minutes"}],"kit_includes":["Preparation guide","Branded handouts","Prompt library","Compliance quick card","AI use policy template","Digital follow-up materials"]}',
    source_filename = '05_Speaker_Kit.docx; 06_Speaker_Bios.docx',
    updated_at = CURRENT_TIMESTAMP
WHERE template_type = 'speaker' AND name = 'Speaker Bios and Kit';

INSERT INTO business_templates (template_type, name, description, content_json, source_filename)
SELECT 'speaker', 'Speaker Bios and Kit',
       'Editable speaker bios, session descriptions, and speaker-kit content based on 05_Speaker_Kit.docx and 06_Speaker_Bios.docx.',
       '{"speaker":"Ahmad Khan","title":"Founder, AI Impact Maine","bios":{"short":"Ahmad Khan is the founder of AI Impact Maine, a Portland-based AI training, audit, and advisory practice helping Maine organizations adopt AI safely and practically.","medium":"Ahmad Khan is the founder of AI Impact Maine, an AI training, audit, and advisory practice based in Portland, Maine. His work helps Maine businesses, nonprofits, municipalities, and housing organizations adopt AI with practical workflows, clear guardrails, and defensible governance.","long":"Ahmad Khan is the founder of AI Impact Maine, an AI training, audit, and advisory practice based in Portland, Maine. Raised in Maine and educated at Gorham High School and the University of Southern Maine, Ahmad brings practical business experience in sales, accounting, documentation, compliance, and communication. He founded AI Impact Maine to help organizations move beyond AI hype and adopt tools safely, responsibly, and usefully."},"first_person":"I help Maine organizations adopt AI safely and practically through training, audits, governance, and advisory support.","sessions":[{"title":"AI for Housing Professionals: What Actually Works","format":"Opening keynote","length":"60 minutes"},{"title":"AI for Property Management Operations","format":"Hands-on workshop","length":"75 minutes"},{"title":"AI for Resident Services and Compliance","format":"Hands-on workshop","length":"75 minutes"},{"title":"AI for Executives and Boards","format":"Strategic discussion","length":"60 minutes"}],"kit_includes":["Preparation guide","Branded handouts","Prompt library","Compliance quick card","AI use policy template","Digital follow-up materials"]}',
       '05_Speaker_Kit.docx; 06_Speaker_Bios.docx'
WHERE NOT EXISTS (SELECT 1 FROM business_templates WHERE template_type = 'speaker' AND name = 'Speaker Bios and Kit');

UPDATE business_templates
SET description = 'Editable green/yellow/red AI compliance quick card based on 03_Compliance_Quick_Card.docx.',
    content_json = '{"principles":["Strip before you paste. Remove names, SSNs, account numbers, addresses, and direct identifiers.","Human owns the decision. AI drafts and suggests. People decide and sign.","Show your work. Keep a record of how AI was used in any decision that could be challenged."],"categories":{"green":{"label":"Safe to use without restrictions","use_cases":["Draft generic internal emails","Summarize non-sensitive public information","Brainstorm training topics","Create first drafts from anonymized scenarios"],"explanation":"Low-risk uses with no sensitive data and no automated decision-making."},"yellow":{"label":"Use with strict guardrails","use_cases":["Draft resident or client communications from anonymized facts","Summarize policies with human review","Prepare compliance checklists","Analyze de-identified operational data"],"explanation":"Allowed only after removing sensitive information, documenting use, and requiring human review."},"red":{"label":"Do not use AI for this","use_cases":["Final eligibility, screening, eviction, accommodation, hiring, or lending decisions","Uploading SSNs, financial records, health records, passwords, or credentials","Replacing legal, compliance, or professional judgment","Secretly using AI where disclosure is required"],"explanation":"High-risk uses that could create legal, privacy, fairness, or trust harms."}}}',
    source_filename = '03_Compliance_Quick_Card.docx',
    updated_at = CURRENT_TIMESTAMP
WHERE template_type = 'compliance_quick_card' AND name = 'Compliance Quick Card';

INSERT INTO business_templates (template_type, name, description, content_json, source_filename)
SELECT 'compliance_quick_card', 'Compliance Quick Card',
       'Editable green/yellow/red AI compliance quick card based on 03_Compliance_Quick_Card.docx.',
       '{"principles":["Strip before you paste. Remove names, SSNs, account numbers, addresses, and direct identifiers.","Human owns the decision. AI drafts and suggests. People decide and sign.","Show your work. Keep a record of how AI was used in any decision that could be challenged."],"categories":{"green":{"label":"Safe to use without restrictions","use_cases":["Draft generic internal emails","Summarize non-sensitive public information","Brainstorm training topics","Create first drafts from anonymized scenarios"],"explanation":"Low-risk uses with no sensitive data and no automated decision-making."},"yellow":{"label":"Use with strict guardrails","use_cases":["Draft resident or client communications from anonymized facts","Summarize policies with human review","Prepare compliance checklists","Analyze de-identified operational data"],"explanation":"Allowed only after removing sensitive information, documenting use, and requiring human review."},"red":{"label":"Do not use AI for this","use_cases":["Final eligibility, screening, eviction, accommodation, hiring, or lending decisions","Uploading SSNs, financial records, health records, passwords, or credentials","Replacing legal, compliance, or professional judgment","Secretly using AI where disclosure is required"],"explanation":"High-risk uses that could create legal, privacy, fairness, or trust harms."}}}',
       '03_Compliance_Quick_Card.docx'
WHERE NOT EXISTS (SELECT 1 FROM business_templates WHERE template_type = 'compliance_quick_card' AND name = 'Compliance Quick Card');

INSERT OR IGNORE INTO migration_versions (version, description)
VALUES ('0007', 'Add business templates and agreement storage');
