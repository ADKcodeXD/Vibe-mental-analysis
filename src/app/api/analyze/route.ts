import { NextRequest, NextResponse } from 'next/server';
import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// --- Types ---
type Answer = { questionId: string; value: string };
type AgentState = {
  answers: Answer[];
  config: { apiKey?: string; baseUrl?: string; model?: string };
  cognitiveAnalysis: string;
  clinicalAnalysis: string;
  valuesAnalysis: string;
  lieAnalysis: string;
  finalProfile: any;
  lang: string;
};

const createModel = (config?: { apiKey?: string; baseUrl?: string; model?: string }) => {
    const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
    const baseUrl = config?.baseUrl || process.env.OPENAI_BASE_URL;
    const modelName = config?.model || process.env.LLM_MODEL || 'google/gemini-3-flash-preview';

    if (!apiKey) {
        throw new Error("Missing API Key. Please configure it in Settings or .env.local");
    }

    return new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelName,
        configuration: {
            baseURL: baseUrl
        },
        temperature: 0.7
    });
};

// --- Graph Definition ---
import { Annotation } from '@langchain/langgraph';

// UPDATE GRAPH STATE DEFINITION
const GraphState = Annotation.Root({
  answers: Annotation<Answer[]>({ reducer: (x, y) => y, default: () => [] }),
  config: Annotation<any>({ reducer: (x, y) => y, default: () => ({}) }),
  cognitiveAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  clinicalAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }), // Renamed from shadow for clarity, but logic handles it
  valuesAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  lieAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  finalProfile: Annotation<any>({ reducer: (x, y) => y, default: () => ({}) }),
  lang: Annotation<string>({ reducer: (x, y) => y, default: () => "zh" })
});

// REDEFINE NODES TO USE STATE CONFIG
const analyzeCognitive = async (state: AgentState) => {
    const model = createModel(state.config);
    const context = state.answers.map(a => `Q: ${a.questionId}\nA: ${a.value}`).join('\n');
    const response = await model.invoke([
        new SystemMessage(`You are an MBTI Expert Pattern Matcher. Analyze the user's answers. Determine their E/I, S/N, T/F, J/P preferences with brief evidence. 
        IMPORTANT: Respond in the user's language: ${state.lang}.`),
        new HumanMessage(context)
    ]);
    return { cognitiveAnalysis: response.content as string };
};

const analyzeValues = async (state: AgentState) => {
    const model = createModel(state.config);
    const context = state.answers.map(a => `Q: ${a.questionId}\nA: ${a.value}`).join('\n');
    
    const response = await model.invoke([
        new SystemMessage(`You are a Political Compass Analyst. Determine the user's 8Values leanings (Economic, Diplomatic, Civil, Societal).
        Use all questionnaire data for a comprehensive view of their values.
        IMPORTANT: Respond in the user's language: ${state.lang}.`),
        new HumanMessage(context)
    ]);
    return { valuesAnalysis: response.content as string };
};

const analyzeLie = async (state: AgentState) => {
    const model = createModel(state.config);
    const context = state.answers.map(a => `Q: ${a.questionId}\nA: ${a.value}`).join('\n');
    
    const response = await model.invoke([
        new SystemMessage(`You are a Human Lie Detector. Analyze the user's answers for inconsistencies.
        
        LOOK FOR CONTRADICTIONS:
        - Claims to be introverted vs Loves crowds.
        - claims to be empathetic vs Shows narcissistic traits.
        - Scenarios vs Self-Description.
        
        IMPORTANT: Respond in the user's language: ${state.lang}.
        
        OUTPUT format:
        Probability: X%
        Contradictions: [ "Q1 says X but Q5 says Y", ... ]
        Verdict: "Truthful" / "Exaggerating" / "Deceptive"
        `),
        new HumanMessage(context)
    ]);
    return { lieAnalysis: response.content as string };
};

const analyzeClinical = async (state: AgentState) => {
    const model = createModel(state.config); 
    const context = state.answers.map(a => `Q: ${a.questionId}\nA: ${a.value}`).join('\n');
    
    let riskFlag = "";
    const risk_q = state.answers.find(a => a.questionId === 'phq9_9_risk');
    if (risk_q && (risk_q.value === "4" || risk_q.value === "5" || risk_q.value === "几乎每天" || risk_q.value.includes("一半以上"))) {
        riskFlag = "CRITICAL: SUICIDE IDEATION DETECTED in Q9.";
    }

    const response = await model.invoke([
        new SystemMessage(`You are an Expert Clinical Psychiatrist. Analyze the screening results and all behavioral data provided.
        RULES:
        1. PHQ-9: Assess Depression Severity.
        2. MDQ: Assess Bipolar Risk.
        3. BEHAVIOR: Use all scenarios to detect deeper psychological defenses and patterns.
        4. SAFETY: If '${riskFlag}' is present, MUST output warning.
        5. LANGUAGE: Respond only in ${state.lang}.
        `),
        new HumanMessage(context)
    ]);
    return { clinicalAnalysis: response.content as string }; 
};

const synthesizeProfile = async (state: AgentState) => {
    const model = createModel(state.config);
    const prompt = `
    GENERATE HOLOGRAPHIC REPORT.
    
    [COGNITIVE] ${state.cognitiveAnalysis}
    [CLINICAL & SHADOW] ${state.clinicalAnalysis}
    [VALUES] ${state.valuesAnalysis}
    [LIE DETECTION] ${state.lieAnalysis}
    [USER INPUTS] ${state.answers.map(a => `Q: ${a.questionId}\nA: ${a.value}`).join('\n')}

    REQUIREMENTS:
    1. Tone: "Roast" style but deeply insightful. Highlight strengths ("Praise") and dark side.
    2. Ideology: Based on the Values analysis, summarize the user's 8Values into a single, well-known ideology label (e.g., "Social Democracy", "Libertarianism", "Neo-Conservatism"). Provide a brief but deep explanation of why this ideology fits them in the 'ideology_note'.
    3. Truth Engine: Evaluate the internal consistency of answers. If the user contradicts themselves (e.g. Q1 vs Q5), call it out. Calculate a "credibility_score" from 0-100 based on consistency and effort.
    4. Clinical Findings: CRITICAL. You must map your analysis to the status/type fields.
       - Depression: If you detect low energy, persistent sadness, or PHQ-9 indicators, set status to Low/Med/High.
       - ADHD: If you detect impulsivity, executive dysfunction, or focus issues, set status to Low/Med/High.
       - Attachment: Categorize accurately (Secure/Avoidant/Anxious/Disorganized).
    
    JSON SCHEMA:
    {
       "identity_card": {
           "archetype": "The Machiavellian Saint",
           "one_liner": "You save the world only to rule it.",
           "mbti": "ENTJ",
           "alignment": "Chaotic Good",
           "ideology": "Social Democracy",
           "personality_tags": ["Ultra-Ambitious", "Hyper-Rational"]
       },
       "clinical_findings": {
           "depression": {
               "status": "None/Low/Med/High",
               "description": "Brief diagnostic insight..."
           },
           "adhd": {
               "status": "None/Low/Med/High",
               "description": "Brief diagnostic insight..."
           },
           "attachment": {
               "type": "Secure/Avoidant/Anxious/Disorganized",
               "description": "Brief diagnostic insight..."
           }
       },
       "stats": {
           "credibility_score": 0-100,
           "lie_probability": 0-100,
           "lie_verdict": "Truthful/Exaggerating/Deceptive",
           "conflicts": ["Q1 vs Q5: User claims high empathy but chooses selfish action in scenario A."]
       },
       "dimensions": {
           "economy": "Market/Equality",
           "diplomacy": "Nation/Globe",
           "civil": "Liberty/Authority",
           "society": "Tradition/Progress"
       },
       "celebrity_match": {
           "name": "Elon Musk",
           "reason": "You share the same visionary narcissism..."
       },
       "analysis": {
           "strengths": "Praise the user here. e.g. 'You are unstoppable...'",
           "dark_side": "The dangerous part...",
           "ideology_note": "A paragraph explaining their political/value alignment based on their questionnaire answers...",
           "clinical_note": "Medical context summary...",
           "advice": "Actionable step."
       }
    }
    `;
    
    const response = await model.invoke([
        new SystemMessage(`You are the Chief Profiler. Output ONLY JSON. 
        IMPORTANT: ENTIRE JSON must be in ${state.lang}. 
        Translate EVERY string value in the resulting JSON to ${state.lang}, including archetype, one_liner, ideology, personality_tags, reason, strengths, dark_side, ideology_note, clinical_note, advice, clinical_findings descriptions, all dimensions axis labels and their values, and all conflict descriptions.
        Maintain a professional yet insightful tone in the target language.`),
        new HumanMessage(prompt)
    ]);
    
    let json = {};
    try {
        const content = response.content as string;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const cleaned = jsonMatch ? jsonMatch[0] : content.replace(/```json/g, '').replace(/```/g, '');
        
        json = JSON.parse(cleaned);
    } catch (e) {
        console.error("Synthesize error:", e);
        console.log("Raw LLM response:", response.content);
        json = { 
            error: "Failed to parse analysis result. The LLM response was not valid JSON.", 
            raw: response.content,
            details: (e as Error).message
        };
    }
    
    return { finalProfile: json };
};

const graph = new StateGraph(GraphState)
.addNode("cognitive", analyzeCognitive)
.addNode("clinical", analyzeClinical)
.addNode("values", analyzeValues)
.addNode("lie", analyzeLie)
.addNode("synthesis", synthesizeProfile)
.setEntryPoint("cognitive")
.addEdge("cognitive", "clinical")
.addEdge("clinical", "values")
.addEdge("values", "lie")
.addEdge("lie", "synthesis")
.addEdge("synthesis", END);


const compiledGraph = graph.compile();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { answers, config, lang } = body;
        
        if (!answers) return NextResponse.json({ error: "No answers provided" }, { status: 400 });
        
        // Pass everything to the graph
        const result = await compiledGraph.invoke({ 
            answers, 
            config: config || {}, 
            lang: lang || 'zh' 
        });
        return NextResponse.json(result.finalProfile);
        
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
