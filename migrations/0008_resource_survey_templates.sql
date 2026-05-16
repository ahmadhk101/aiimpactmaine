UPDATE survey_templates SET
  description = 'AI cybersecurity readiness checklist based on 01. Cyber Security Guide Full.pdf. Use for security, privacy, vendor, incident response, and staff awareness review.',
  questions = '[{"id":"data_classification","type":"rating","label":"How clearly has your organization classified data that must never be entered into AI tools?","required":true},{"id":"approved_tools","type":"single","label":"Do staff know which AI tools are approved for work use?","options":["No approved list exists","Informal guidance only","Approved list exists but is not widely communicated","Approved list is documented and trained","Approved list is enforced and reviewed"],"required":true},{"id":"sensitive_data_controls","type":"multi","label":"Which controls are currently in place for sensitive data?","options":["PII removal guidance","Access controls","AI vendor review","Audit logs","Incident response process","Employee training"],"required":false},{"id":"vendor_security","type":"rating","label":"How mature is your AI vendor security review process?","required":true},{"id":"incident_response","type":"yesno","label":"Do you have a documented process for suspected AI-related data exposure?","required":true},{"id":"biggest_security_gap","type":"longtext","label":"What is the biggest AI security gap or concern right now?","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'AI Cybersecurity Readiness Checklist';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'AI Cybersecurity Readiness Checklist',
       'AI cybersecurity readiness checklist based on 01. Cyber Security Guide Full.pdf. Use for security, privacy, vendor, incident response, and staff awareness review.',
       '[{"id":"data_classification","type":"rating","label":"How clearly has your organization classified data that must never be entered into AI tools?","required":true},{"id":"approved_tools","type":"single","label":"Do staff know which AI tools are approved for work use?","options":["No approved list exists","Informal guidance only","Approved list exists but is not widely communicated","Approved list is documented and trained","Approved list is enforced and reviewed"],"required":true},{"id":"sensitive_data_controls","type":"multi","label":"Which controls are currently in place for sensitive data?","options":["PII removal guidance","Access controls","AI vendor review","Audit logs","Incident response process","Employee training"],"required":false},{"id":"vendor_security","type":"rating","label":"How mature is your AI vendor security review process?","required":true},{"id":"incident_response","type":"yesno","label":"Do you have a documented process for suspected AI-related data exposure?","required":true},{"id":"biggest_security_gap","type":"longtext","label":"What is the biggest AI security gap or concern right now?","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'AI Cybersecurity Readiness Checklist');

UPDATE survey_templates SET
  description = 'AI governance readiness assessment based on 02. AI Governance Starter Kit Full.pdf. Use to assess ownership, policy, risk review, and executive accountability.',
  questions = '[{"id":"governance_owner","type":"single","label":"Who currently owns AI governance?","options":["No owner","Informal individual owner","Department-level owner","Cross-functional team","Executive-sponsored governance group"],"required":true},{"id":"ai_policy_status","type":"single","label":"What is the status of your AI policy?","options":["None","Informal guidance","Draft policy","Approved policy","Approved and trained"],"required":true},{"id":"risk_review","type":"rating","label":"How consistently are AI use cases reviewed for risk before rollout?","required":true},{"id":"stakeholders","type":"multi","label":"Which groups are involved in AI governance?","options":["Executive leadership","IT/security","Legal/compliance","HR","Operations","Frontline staff","Clients/community"],"required":false},{"id":"documentation","type":"yesno","label":"Do you keep a record of approved AI tools and use cases?","required":true},{"id":"governance_next_step","type":"longtext","label":"What governance decision or document is most urgent?","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'AI Governance Readiness Assessment';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'AI Governance Readiness Assessment',
       'AI governance readiness assessment based on 02. AI Governance Starter Kit Full.pdf. Use to assess ownership, policy, risk review, and executive accountability.',
       '[{"id":"governance_owner","type":"single","label":"Who currently owns AI governance?","options":["No owner","Informal individual owner","Department-level owner","Cross-functional team","Executive-sponsored governance group"],"required":true},{"id":"ai_policy_status","type":"single","label":"What is the status of your AI policy?","options":["None","Informal guidance","Draft policy","Approved policy","Approved and trained"],"required":true},{"id":"risk_review","type":"rating","label":"How consistently are AI use cases reviewed for risk before rollout?","required":true},{"id":"stakeholders","type":"multi","label":"Which groups are involved in AI governance?","options":["Executive leadership","IT/security","Legal/compliance","HR","Operations","Frontline staff","Clients/community"],"required":false},{"id":"documentation","type":"yesno","label":"Do you keep a record of approved AI tools and use cases?","required":true},{"id":"governance_next_step","type":"longtext","label":"What governance decision or document is most urgent?","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'AI Governance Readiness Assessment');

UPDATE survey_templates SET
  description = 'AI policy and tool approval intake based on 03. AI Policy Full.pdf. Use before approving a new AI tool or use case.',
  questions = '[{"id":"tool_name","type":"text","label":"What AI tool or system is being requested?","required":true},{"id":"business_purpose","type":"longtext","label":"What business problem or workflow will this tool support?","required":true},{"id":"data_types","type":"multi","label":"What data may be used with this tool?","options":["Public information","Internal business information","Client/customer information","Financial information","Health information","Employee information","Confidential or regulated data"],"required":true},{"id":"approval_need","type":"single","label":"What approval decision is needed?","options":["New tool approval","New use case for approved tool","Policy exception","Pilot approval","Renewal or vendor review"],"required":true},{"id":"human_review","type":"yesno","label":"Will a human review outputs before use in decisions or communications?","required":true},{"id":"risk_notes","type":"longtext","label":"Known risks, constraints, or compliance concerns","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'AI Policy and Tool Approval Intake';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'AI Policy and Tool Approval Intake',
       'AI policy and tool approval intake based on 03. AI Policy Full.pdf. Use before approving a new AI tool or use case.',
       '[{"id":"tool_name","type":"text","label":"What AI tool or system is being requested?","required":true},{"id":"business_purpose","type":"longtext","label":"What business problem or workflow will this tool support?","required":true},{"id":"data_types","type":"multi","label":"What data may be used with this tool?","options":["Public information","Internal business information","Client/customer information","Financial information","Health information","Employee information","Confidential or regulated data"],"required":true},{"id":"approval_need","type":"single","label":"What approval decision is needed?","options":["New tool approval","New use case for approved tool","Policy exception","Pilot approval","Renewal or vendor review"],"required":true},{"id":"human_review","type":"yesno","label":"Will a human review outputs before use in decisions or communications?","required":true},{"id":"risk_notes","type":"longtext","label":"Known risks, constraints, or compliance concerns","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'AI Policy and Tool Approval Intake');

UPDATE survey_templates SET
  description = 'Scored AI maturity assessment based on 04. AI Readiness Full.pdf. Use for strategy, use cases, resources, data, governance, and adoption readiness.',
  questions = '[{"id":"leadership_alignment","type":"rating","label":"How aligned is leadership around AI goals and priorities?","required":true},{"id":"use_case_clarity","type":"rating","label":"How clearly have AI use cases been identified and prioritized?","required":true},{"id":"budget_resources","type":"rating","label":"How prepared is the organization to fund and resource AI work?","required":true},{"id":"data_readiness","type":"rating","label":"How ready are your data, documents, and workflows for AI use?","required":true},{"id":"staff_capability","type":"rating","label":"How confident are staff in using AI safely and effectively?","required":true},{"id":"governance_maturity","type":"rating","label":"How mature are your AI policies, controls, and accountability?","required":true},{"id":"priority_use_cases","type":"longtext","label":"List the top AI use cases you want to evaluate first.","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'Scored AI Maturity Assessment';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'Scored AI Maturity Assessment',
       'Scored AI maturity assessment based on 04. AI Readiness Full.pdf. Use for strategy, use cases, resources, data, governance, and adoption readiness.',
       '[{"id":"leadership_alignment","type":"rating","label":"How aligned is leadership around AI goals and priorities?","required":true},{"id":"use_case_clarity","type":"rating","label":"How clearly have AI use cases been identified and prioritized?","required":true},{"id":"budget_resources","type":"rating","label":"How prepared is the organization to fund and resource AI work?","required":true},{"id":"data_readiness","type":"rating","label":"How ready are your data, documents, and workflows for AI use?","required":true},{"id":"staff_capability","type":"rating","label":"How confident are staff in using AI safely and effectively?","required":true},{"id":"governance_maturity","type":"rating","label":"How mature are your AI policies, controls, and accountability?","required":true},{"id":"priority_use_cases","type":"longtext","label":"List the top AI use cases you want to evaluate first.","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'Scored AI Maturity Assessment');

UPDATE survey_templates SET
  description = 'Training pre/post knowledge check based on 05. AI Training Full.pdf. Use before or after team training.',
  questions = '[{"id":"ai_fundamentals_confidence","type":"rating","label":"How confident are you explaining what AI can and cannot do?","required":true},{"id":"safe_use_confidence","type":"rating","label":"How confident are you using AI without exposing sensitive data?","required":true},{"id":"prompting_confidence","type":"rating","label":"How confident are you writing clear prompts for work tasks?","required":true},{"id":"output_review","type":"single","label":"What should you do before using an AI-generated answer?","options":["Use it immediately","Review accuracy and context","Assume it is approved","Share it publicly"],"required":true},{"id":"training_needs","type":"multi","label":"Which topics need more training?","options":["AI basics","Privacy and security","Prompt writing","Reviewing outputs","Policy and approval","Role-specific workflows"],"required":false},{"id":"next_application","type":"longtext","label":"What is one safe work task where you could apply AI next?","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'AI Training Pre/Post Knowledge Check';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'AI Training Pre/Post Knowledge Check',
       'Training pre/post knowledge check based on 05. AI Training Full.pdf. Use before or after team training.',
       '[{"id":"ai_fundamentals_confidence","type":"rating","label":"How confident are you explaining what AI can and cannot do?","required":true},{"id":"safe_use_confidence","type":"rating","label":"How confident are you using AI without exposing sensitive data?","required":true},{"id":"prompting_confidence","type":"rating","label":"How confident are you writing clear prompts for work tasks?","required":true},{"id":"output_review","type":"single","label":"What should you do before using an AI-generated answer?","options":["Use it immediately","Review accuracy and context","Assume it is approved","Share it publicly"],"required":true},{"id":"training_needs","type":"multi","label":"Which topics need more training?","options":["AI basics","Privacy and security","Prompt writing","Reviewing outputs","Policy and approval","Role-specific workflows"],"required":false},{"id":"next_application","type":"longtext","label":"What is one safe work task where you could apply AI next?","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'AI Training Pre/Post Knowledge Check');

UPDATE survey_templates SET
  description = 'Employee AI safety quiz and attestation based on 06. ChatGPT Safety Full.pdf.',
  questions = '[{"id":"client_data_rule","type":"single","label":"Is it acceptable to paste client or customer details into a public AI tool?","options":["Yes","No","Only if it saves time","Only if the output is internal"],"required":true},{"id":"sensitive_data","type":"multi","label":"Which data should not be shared with unapproved AI tools?","options":["Passwords or credentials","Health information","Financial records","Customer details","Public website text","Confidential documents"],"required":true},{"id":"safe_workflow","type":"single","label":"What is the safest first step before using AI on a work scenario?","options":["Paste the full original file","Remove identifying and sensitive details","Ask AI to decide policy","Skip human review"],"required":true},{"id":"review_outputs","type":"yesno","label":"Do AI outputs need human review before use?","required":true},{"id":"policy_acknowledgment","type":"yesno","label":"I understand that I must follow organization AI policy and ask if unsure.","required":true},{"id":"safety_question","type":"longtext","label":"What AI safety question do you still have?","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'Employee AI Safety Quiz and Attestation';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'Employee AI Safety Quiz and Attestation',
       'Employee AI safety quiz and attestation based on 06. ChatGPT Safety Full.pdf.',
       '[{"id":"client_data_rule","type":"single","label":"Is it acceptable to paste client or customer details into a public AI tool?","options":["Yes","No","Only if it saves time","Only if the output is internal"],"required":true},{"id":"sensitive_data","type":"multi","label":"Which data should not be shared with unapproved AI tools?","options":["Passwords or credentials","Health information","Financial records","Customer details","Public website text","Confidential documents"],"required":true},{"id":"safe_workflow","type":"single","label":"What is the safest first step before using AI on a work scenario?","options":["Paste the full original file","Remove identifying and sensitive details","Ask AI to decide policy","Skip human review"],"required":true},{"id":"review_outputs","type":"yesno","label":"Do AI outputs need human review before use?","required":true},{"id":"policy_acknowledgment","type":"yesno","label":"I understand that I must follow organization AI policy and ask if unsure.","required":true},{"id":"safety_question","type":"longtext","label":"What AI safety question do you still have?","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'Employee AI Safety Quiz and Attestation');

UPDATE survey_templates SET
  description = 'Municipal AI risk assessment based on 07. Municipal AI Risk Assessment Full.pdf. Use for public-sector transparency, accountability, vendor, and risk review.',
  questions = '[{"id":"municipal_use_case","type":"longtext","label":"What municipal AI use case or system is being assessed?","required":true},{"id":"citizen_data","type":"yesno","label":"Will the use case involve citizen, resident, or employee data?","required":true},{"id":"public_impact","type":"rating","label":"How significant is the potential public impact if the AI system is wrong or biased?","required":true},{"id":"transparency_plan","type":"rating","label":"How clear is the plan to disclose, explain, and document AI use?","required":true},{"id":"vendor_controls","type":"rating","label":"How strong are vendor security, data handling, and exit controls?","required":true},{"id":"appeal_process","type":"yesno","label":"Is there a human appeal or complaint process for affected residents?","required":true},{"id":"mitigation_steps","type":"longtext","label":"What mitigation steps are required before approval?","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'Municipal AI Risk Assessment';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'Municipal AI Risk Assessment',
       'Municipal AI risk assessment based on 07. Municipal AI Risk Assessment Full.pdf. Use for public-sector transparency, accountability, vendor, and risk review.',
       '[{"id":"municipal_use_case","type":"longtext","label":"What municipal AI use case or system is being assessed?","required":true},{"id":"citizen_data","type":"yesno","label":"Will the use case involve citizen, resident, or employee data?","required":true},{"id":"public_impact","type":"rating","label":"How significant is the potential public impact if the AI system is wrong or biased?","required":true},{"id":"transparency_plan","type":"rating","label":"How clear is the plan to disclose, explain, and document AI use?","required":true},{"id":"vendor_controls","type":"rating","label":"How strong are vendor security, data handling, and exit controls?","required":true},{"id":"appeal_process","type":"yesno","label":"Is there a human appeal or complaint process for affected residents?","required":true},{"id":"mitigation_steps","type":"longtext","label":"What mitigation steps are required before approval?","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'Municipal AI Risk Assessment');

UPDATE survey_templates SET
  description = 'Nonprofit AI adoption readiness survey based on 08. Nonprofit AI Adoption Full.pdf. Use for mission alignment, donor privacy, funding, and implementation readiness.',
  questions = '[{"id":"mission_alignment","type":"rating","label":"How clearly is AI tied to mission impact rather than technology for its own sake?","required":true},{"id":"priority_functions","type":"multi","label":"Where could AI support the organization?","options":["Fundraising and development","Grant writing","Program delivery","Volunteer management","Communications","Operations","Impact measurement","Accessibility and inclusion"],"required":true},{"id":"privacy_readiness","type":"rating","label":"How ready are you to protect donor, beneficiary, volunteer, and staff data in AI workflows?","required":true},{"id":"budget_capacity","type":"single","label":"What is your current AI funding capacity?","options":["No budget","Small pilot budget","Grant-funded possibility","Dedicated budget","Multi-year investment plan"],"required":true},{"id":"success_metrics","type":"longtext","label":"What mission or operational outcomes should AI improve?","required":false},{"id":"risk_concerns","type":"longtext","label":"What risks or stakeholder concerns need to be addressed?","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'Nonprofit AI Adoption Readiness Survey';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'Nonprofit AI Adoption Readiness Survey',
       'Nonprofit AI adoption readiness survey based on 08. Nonprofit AI Adoption Full.pdf. Use for mission alignment, donor privacy, funding, and implementation readiness.',
       '[{"id":"mission_alignment","type":"rating","label":"How clearly is AI tied to mission impact rather than technology for its own sake?","required":true},{"id":"priority_functions","type":"multi","label":"Where could AI support the organization?","options":["Fundraising and development","Grant writing","Program delivery","Volunteer management","Communications","Operations","Impact measurement","Accessibility and inclusion"],"required":true},{"id":"privacy_readiness","type":"rating","label":"How ready are you to protect donor, beneficiary, volunteer, and staff data in AI workflows?","required":true},{"id":"budget_capacity","type":"single","label":"What is your current AI funding capacity?","options":["No budget","Small pilot budget","Grant-funded possibility","Dedicated budget","Multi-year investment plan"],"required":true},{"id":"success_metrics","type":"longtext","label":"What mission or operational outcomes should AI improve?","required":false},{"id":"risk_concerns","type":"longtext","label":"What risks or stakeholder concerns need to be addressed?","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'Nonprofit AI Adoption Readiness Survey');

UPDATE survey_templates SET
  description = 'Prompt skills self-assessment and practical quiz based on 09. Prompt Engineering Guide Full.pdf.',
  questions = '[{"id":"role_prompt","type":"yesno","label":"Can you write a role-based prompt for a work task?","required":true},{"id":"specificity","type":"rating","label":"How consistently do your prompts include audience, format, tone, constraints, and context?","required":true},{"id":"examples_use","type":"single","label":"When would you use examples in a prompt?","options":["When you want AI to match a style or pattern","Never","Only for coding","Only after the final answer"],"required":true},{"id":"iteration","type":"rating","label":"How comfortable are you refining AI outputs through follow-up prompts?","required":true},{"id":"prompt_categories","type":"multi","label":"Which prompt categories do you use or want to learn?","options":["Writing","Analysis and research","Brainstorming","Business communications","Technical work","Meeting summaries"],"required":false},{"id":"sample_prompt","type":"longtext","label":"Write a sample prompt for a real work task you want to improve.","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'Prompt Skills Self-Assessment';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'Prompt Skills Self-Assessment',
       'Prompt skills self-assessment and practical quiz based on 09. Prompt Engineering Guide Full.pdf.',
       '[{"id":"role_prompt","type":"yesno","label":"Can you write a role-based prompt for a work task?","required":true},{"id":"specificity","type":"rating","label":"How consistently do your prompts include audience, format, tone, constraints, and context?","required":true},{"id":"examples_use","type":"single","label":"When would you use examples in a prompt?","options":["When you want AI to match a style or pattern","Never","Only for coding","Only after the final answer"],"required":true},{"id":"iteration","type":"rating","label":"How comfortable are you refining AI outputs through follow-up prompts?","required":true},{"id":"prompt_categories","type":"multi","label":"Which prompt categories do you use or want to learn?","options":["Writing","Analysis and research","Brainstorming","Business communications","Technical work","Meeting summaries"],"required":false},{"id":"sample_prompt","type":"longtext","label":"Write a sample prompt for a real work task you want to improve.","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'Prompt Skills Self-Assessment');

UPDATE survey_templates SET
  description = 'Responsible AI project review assessment based on 10. Responsible AI Framework Full.pdf. Use for fairness, transparency, accountability, privacy, safety, inclusivity, and sustainability.',
  questions = '[{"id":"project_description","type":"longtext","label":"Describe the AI project or use case being reviewed.","required":true},{"id":"fairness","type":"rating","label":"How well has the project addressed fairness and bias risk?","required":true},{"id":"transparency","type":"rating","label":"How clearly can users or stakeholders understand AI use and limitations?","required":true},{"id":"accountability","type":"rating","label":"How clearly are human owners and decision rights defined?","required":true},{"id":"privacy_safety","type":"rating","label":"How well does the project protect privacy, security, and safety?","required":true},{"id":"stakeholders","type":"multi","label":"Which stakeholders should be considered before approval?","options":["Customers or clients","Employees","Leadership","Legal or compliance","Community members","Vendors","Funders or regulators"],"required":false},{"id":"approval_decision","type":"single","label":"Recommended decision","options":["Approve","Approve with conditions","Revise and resubmit","Do not approve"],"required":true},{"id":"conditions","type":"longtext","label":"Required conditions, mitigations, or monitoring steps","required":false}]',
  is_system = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'Responsible AI Project Review Assessment';

INSERT INTO survey_templates (name, description, questions, is_system)
SELECT 'Responsible AI Project Review Assessment',
       'Responsible AI project review assessment based on 10. Responsible AI Framework Full.pdf. Use for fairness, transparency, accountability, privacy, safety, inclusivity, and sustainability.',
       '[{"id":"project_description","type":"longtext","label":"Describe the AI project or use case being reviewed.","required":true},{"id":"fairness","type":"rating","label":"How well has the project addressed fairness and bias risk?","required":true},{"id":"transparency","type":"rating","label":"How clearly can users or stakeholders understand AI use and limitations?","required":true},{"id":"accountability","type":"rating","label":"How clearly are human owners and decision rights defined?","required":true},{"id":"privacy_safety","type":"rating","label":"How well does the project protect privacy, security, and safety?","required":true},{"id":"stakeholders","type":"multi","label":"Which stakeholders should be considered before approval?","options":["Customers or clients","Employees","Leadership","Legal or compliance","Community members","Vendors","Funders or regulators"],"required":false},{"id":"approval_decision","type":"single","label":"Recommended decision","options":["Approve","Approve with conditions","Revise and resubmit","Do not approve"],"required":true},{"id":"conditions","type":"longtext","label":"Required conditions, mitigations, or monitoring steps","required":false}]',
       1
WHERE NOT EXISTS (SELECT 1 FROM survey_templates WHERE name = 'Responsible AI Project Review Assessment');

INSERT OR IGNORE INTO migration_versions (version, description)
VALUES ('0008', 'Seed resource-based survey templates from full guides');
