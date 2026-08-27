# Copilot Hallucination Audit

## Overview
This audit evaluates the current AI investigation copilot architecture to identify areas where the LLM might hallucinate facts, invent evidence, or violate the strict requirement that Catalyst Datastore is the ONLY source of truth.

## Investigated Components
- `react-app/src/components/chat/InvestigationChat.jsx`
- `functions/vikshana_function/services/CopilotService.js`
- `functions/vikshana_function/controllers/ConversationController.js`
- `functions/vikshana_function/agents/ReportAgent.js`
- `functions/vikshana_function/prompts/reportPrompt.js`
- `functions/vikshana_function/services/ContextBuilderService.js`

## Findings: Hallucination Vectors

### 1. The System Prompt (`reportPrompt.js`) Forces Invention
- **Issue**: The current prompt rigidly demands a large structured output (Executive Summary, Key Findings, Timeline, Evidence Considered, AI Analysis, Risk Assessment, Recommended Actions, Conclusion) for *every* generation.
- **Risk**: When asked a simple, targeted question (e.g., "What was the weapon?"), the LLM is forced to populate an entire report template. If the case context lacks data for "Timeline" or "Risk Assessment", the LLM is highly likely to hallucinate plausible-sounding answers to satisfy the template's structural requirements.

### 2. Lack of Explicit Hierarchy for Evidence Status
- **Issue**: While the prompt instructs the AI to "Separate facts from AI-generated insights", it does not enforce a strict response hierarchy (e.g., `CONFIRMED`, `EVIDENCE-BACKED`, `AI-INFERRED`, `UNAVAILABLE`).
- **Risk**: The AI can easily state "The suspect committed the crime" or "The suspect used a knife" as a fact under the "AI Analysis" section without explicitly marking it as an inference vs. a confirmed fact.

### 3. Missing Post-Generation Deterministic Guard
- **Issue**: Currently, `ReportAgent.generateReport` directly streams the LLM response to the client. There is no intermediate step that verifies if the entities, dates, or actions mentioned in the LLM's response actually exist in the retrieved case context ledger.
- **Risk**: If the LLM generates a fake suspect name or an incorrect date, it is delivered to the user unchallenged.

### 4. Over-eager Case Guessing and Cross-case Leakage
- **Issue**: `ConversationController.detectCaseIdFromQuery` attempts to guess the target case ID based on keyword matching (e.g., matching locations or crime types). 
- **Risk**: If a user asks "Are there any burglary cases?", the system might switch the context to a random burglary case instead of returning an aggregation or asking for clarification, potentially leading to cross-case leakage if the user assumes they are still querying their active case.

### 5. Inadequate Follow-up Question Handling
- **Issue**: The system relies on the LLM to recognize when it doesn't have the answer to follow-up questions.
- **Risk**: Because of the instruction to "provide a step-by-step investigation plan" and "fill in the missing details" (implicit in the "Recommended Actions" and "Conclusion" sections), the LLM will often guess the answer to follow-up questions based on general criminal investigation tropes rather than strictly stating "Insufficient evidence in the available case records."

## Summary of Vulnerabilities
1. **Inventing a suspect/evidence**: High risk due to structural prompt demands.
2. **Inventing dates/locations**: High risk if the `timeline` array in the ledger is empty.
3. **Inventing investigative actions**: High risk because the prompt explicitly demands "Recommended Actions" even if no data exists.
4. **Inferring unsupported facts**: High risk; the prompt encourages identifying "Suspicious patterns" and "Correlations" which the LLM may invent.
5. **Cross-case leakage**: Moderate risk due to fuzzy keyword matching in `ConversationController`.

## Conclusion
The current Copilot relies entirely on basic Prompt Engineering to prevent hallucinations, which is insufficient. A deterministic hallucination guard and a fundamental rewrite of the Copilot System Prompt are required to harden the system to the requested standards.
