import { NextRequest, NextResponse } from 'next/server';
import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

// Load language data
import questionsZh from "@/data/questions/zh.json";
import questionsEn from "@/data/questions/en.json";
import questionsJa from "@/data/questions/ja.json";

const questionsDataMap: Record<string, any> = {
    zh: questionsZh,
    en: questionsEn,
    ja: questionsJa
};

// Helper to lookup question text
const getQuestionText = (id: string, lang: string = 'zh') => {
    const data = questionsDataMap[lang] || questionsDataMap['zh'];
    for (const section of data.sections) {
        const q = section.questions.find((q: any) => q.id === id);
        if (q) return q.text;
    }
    // Fallback search across all languages if not found in requested
    for (const l of Object.keys(questionsDataMap)) {
        for (const section of questionsDataMap[l].sections) {
            const q = section.questions.find((q: any) => q.id === id);
            if (q) return q.text;
        }
    }
    return id;
};

// --- Zod Schemas ---
const ScoreSchema = z.object({
    score: z.number().min(0).max(100).describe("0-100 score, where 100 is maximum intensity of the trait"),
    level: z.enum(["Low", "Medium", "High", "Critical"]).describe("Qualitative level based on score"),
    explanation: z.string().describe("Brief explanation of why this score was assigned")
});

const DimensionSchema = z.object({
    label: z.string().describe("The dominant pole, e.g. 'Liberty'"),
    value: z.number().min(0).max(100).describe("0-100 position on the axis, where 50 is neutral"),
    axis_label: z.string().describe("The axis name, e.g. 'Liberty vs Authority'")
});

const FinalProfileSchema = z.object({
    identity_card: z.object({
        archetype: z.string(),
        one_liner: z.string(),
        mbti: z.string(),
        alignment: z.string(),
        ideology: z.string(),
        personality_tags: z.array(z.string()),
        clinical_label: z.string(),
        clinical_explanation: z.string()
    }),
    clinical_findings: z.object({
        depression: ScoreSchema,
        anxiety: ScoreSchema,
        adhd: ScoreSchema,
        narcissism: ScoreSchema,
        sexual_repression: ScoreSchema,
        attachment: z.object({
            type: z.enum(["Secure", "Anxious-Preoccupied", "Dismissive-Avoidant", "Fearful-Avoidant"]),
            description: z.string()
        })
    }),
    scores: z.object({
        repression_index: z.number().describe("0-100 Overall Repression Index"),
        happiness_index: z.number().describe("0-100 Subjective Happiness/Satisfaction"),
        social_adaptation: z.number().describe("0-100 Ability to fit into social norms"),
        independent_thinking: z.number().describe("0-100 Critical thinking capability"),
        consistency_score: z.number().describe("0-100 Logical consistency of answers")
    }),
    dimensions: z.object({
        economic: DimensionSchema.describe("Equality (0) vs Markets (100)"),
        diplomatic: DimensionSchema.describe("Nation (0) vs Globe (100)"),
        civil: DimensionSchema.describe("Authority (0) vs Liberty (100)"),
        societal: DimensionSchema.describe("Tradition (0) vs Progress (100)")
    }),
    career_analysis: z.object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        suitable_careers: z.array(z.string()),
        workplace_advice: z.string()
    }),
    social_analysis: z.object({
        overview: z.string(),
        advice: z.string()
    }),
    highlights: z.object({
        talents: z.array(z.string()),
        liabilities: z.array(z.string())
    }),
    celebrity_match: z.object({
        name: z.string(),
        reason: z.string()
    }),
    analysis: z.object({
        strengths: z.string(),
        dark_side: z.string(),
        ideology_note: z.string(),
        clinical_note: z.string(),
        advice: z.string()
    })
});

// --- Types ---
type Answer = { questionId: string; value: string };
type AgentState = {
  answers: Answer[];
  config: { apiKey?: string; baseUrl?: string; model?: string };
  cognitiveAnalysis: string;
  clinicalAnalysis: string;
  valuesAnalysis: string;
  lieAnalysis: string;
  sexualAnalysis: string;
  thinkingAnalysis: string;
  finalProfile: any;
  lang: string;
};

const createModel = (config?: { apiKey?: string; baseUrl?: string; model?: string }, temperature: number = 0.1) => {
    const clean = (val: string | undefined) => val?.trim().replace(/^["']|["']$/g, '').trim();

    // Robustly handle empty strings or undefined from client
    const apiKey = (config?.apiKey && config.apiKey.trim() !== '') ? clean(config.apiKey) : clean(process.env.OPENAI_API_KEY);
    const baseUrl = (config?.baseUrl && config.baseUrl.trim() !== '') ? clean(config.baseUrl) : clean(process.env.OPENAI_BASE_URL);
    const modelName = (config?.model && config.model.trim() !== '') ? clean(config.model) : (clean(process.env.LLM_MODEL) || 'google/gemini-2.0-flash-001');

    console.log(`[API Analyze V3] Model: ${modelName}, Base: ${baseUrl}, KeyPrefix: ${apiKey?.substring(0, 10)}... (Len: ${apiKey?.length})`);

    return new ChatOpenAI({
        apiKey: apiKey,
        openAIApiKey: apiKey,
        modelName: modelName,
        configuration: {
            baseURL: baseUrl || undefined, // Standard OpenAI client field
            // @ts-ignore - Handle lowercase variant just in case
            baseUrl: baseUrl || undefined, 
            defaultHeaders: {
                "HTTP-Referer": "https://vibe-mental-analysis.pages.dev",
                "X-Title": "Vibe Mental Analysis",
            }
        },
        temperature: temperature,
        modelKwargs: {
            top_p: 0.1
        },
        maxRetries: 1
    });
};

// --- Graph Definition ---
import { Annotation } from '@langchain/langgraph';

const GraphState = Annotation.Root({
  answers: Annotation<Answer[]>({ reducer: (x, y) => y, default: () => [] }),
  config: Annotation<any>({ reducer: (x, y) => y, default: () => ({}) }),
  cognitiveAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  clinicalAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  valuesAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  lieAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  sexualAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  thinkingAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  finalProfile: Annotation<any>({ reducer: (x, y) => y, default: () => ({}) }),
  lang: Annotation<string>({ reducer: (x, y) => y, default: () => "zh" })
});

// NODES
const analyzeCognitive = async (state: AgentState) => {
    const model = createModel(state.config);
    const context = state.answers.map(a => `Q: ${getQuestionText(a.questionId, state.lang)}\nA: ${a.value}`).join('\n');
    const response = await model.invoke([
        new SystemMessage(`You are an Expert Pattern Matcher. Analyze the user's answers. Determine their MBTI (E/I, S/N, T/F, J/P) and general cognitive patterns with brief evidence. Response in ${state.lang}.`),
        new HumanMessage(context)
    ]);
    return { cognitiveAnalysis: response.content as string };
};

const analyzeValues = async (state: AgentState) => {
    const model = createModel(state.config);
    const context = state.answers.map(a => `Q: ${getQuestionText(a.questionId, state.lang)}\nA: ${a.value}`).join('\n');
    const response = await model.invoke([
        new SystemMessage(`You are a Political Compass Analyst. Determine the user's 8Values leanings (Economic, Diplomatic, Civil, Societal). Use all questionnaire data. Response in ${state.lang}.`),
        new HumanMessage(context)
    ]);
    return { valuesAnalysis: response.content as string };
};

const analyzeLie = async (state: AgentState) => {
    const model = createModel(state.config);
    const context = state.answers.map(a => `Q: ${getQuestionText(a.questionId, state.lang)}\nA: ${a.value}`).join('\n');
    const response = await model.invoke([
        new SystemMessage(`You are a Human Lie Detector. Analyze the user's answers for inconsistencies/contradictions. Output a probability of deception and list contradictions. Response in ${state.lang}.`),
        new HumanMessage(context)
    ]);
    return { lieAnalysis: response.content as string };
};

const analyzeClinical = async (state: AgentState) => {
    const model = createModel(state.config); 
    const context = state.answers.map(a => `Q: ${getQuestionText(a.questionId, state.lang)}\nA: ${a.value}`).join('\n');
    
    let riskFlag = "";
    const risk_q = state.answers.find(a => a.questionId === 'phq9_9_risk');
    if (risk_q && (risk_q.value === "4" || risk_q.value === "5" || risk_q.value === "几乎每天" || risk_q.value.includes("一半以上") || risk_q.value.includes("Almost every day"))) {
        riskFlag = "CRITICAL: SUICIDE IDEATION DETECTED in Q9.";
    }

    const response = await model.invoke([
        new SystemMessage(`You are an Expert Clinical Psychiatrist. Analyze the behavioral data.
        RULES:
        1. PHQ-9: Assess Depression.
        2. BEHAVIOR: Detect Narcissism, Bipolar, ADHD, Anxiety.
        3. ATTACHMENT: Determine style.
        4. SAFETY: If '${riskFlag}' is present, MUST output warning.
        Response in ${state.lang}.`),
        new HumanMessage(context)
    ]);
    return { clinicalAnalysis: response.content as string }; 
};

const analyzeSexual = async (state: AgentState) => {
    const model = createModel(state.config);
    const context = state.answers.map(a => `Q: ${getQuestionText(a.questionId, state.lang)}\nA: ${a.value}`).join('\n');
    const response = await model.invoke([
        new SystemMessage(`You are a Psychoanalytic Expert specializing in Sexual Psychology. Analyze the user's responses regarding sexual repression, guilt, norms, and desire.
        Determine:
        1. Level of Sexual Repression (Low/Med/High).
        2. Impact of social norms/guilt.
        3. Connection to overall anxiety.
        Response in ${state.lang}.`),
        new HumanMessage(context)
    ]);
    return { sexualAnalysis: response.content as string };
};

const analyzeThinking = async (state: AgentState) => {
    const model = createModel(state.config);
    const context = state.answers.map(a => `Q: ${getQuestionText(a.questionId, state.lang)}\nA: ${a.value}`).join('\n');
    const response = await model.invoke([
        new SystemMessage(`You are a Cognitive Scientist. Analyze the user's Independent Thinking capabilities.
        Determine:
        1. Conformity level (Sheep vs Wolf).
        2. Critical thinking depth.
        3. Source of validation (Internal vs External).
        Response in ${state.lang}.`),
        new HumanMessage(context)
    ]);
    return { thinkingAnalysis: response.content as string };
};

const synthesizeProfile = async (state: AgentState) => {
    const model = createModel(state.config, 0.2); // Slightly higher temp for creative synthesis
    const structuredModel = model.withStructuredOutput(FinalProfileSchema);
    
    const prompt = `
    GENERATE HOLOGRAPHIC PERSONALITY REPORT.
    
    [COGNITIVE] ${state.cognitiveAnalysis}
    [CLINICAL] ${state.clinicalAnalysis}
    [VALUES] ${state.valuesAnalysis}
    [LIE DETECTION] ${state.lieAnalysis}
    [SEXUAL PSYCHOLOGY] ${state.sexualAnalysis}
    [CRITICAL THINKING] ${state.thinkingAnalysis}
    [USER INPUTS] ${state.answers.map(a => `Q: ${getQuestionText(a.questionId, state.lang)}\nA: ${a.value}`).join('\n')}

    REQUIREMENTS:
    1.  **Roast & Insight**: Be brutally honest yet scientifically accurate. High-level psychoanalysis.
    2.  **Stats & Scores**: You MUST calculate the 0-100 scores based on the evidence.
    3.  **Dimensions**: Fill the Political Compass dimensions accurately (0-100).
    4.  **Clinical**: Map depression, anxiety, ADHD, etc. to scores and levels.
    5.  **Sexual Repression**: specifically analyze the sexual data for the sexual_repression field.
    6.  **Language**: All text content (descriptions, advice, archetypes) MUST be in ${state.lang}.
    7.  **Celebrity Match**: Cultural context applies (Anime/History for Asian langs, etc).
    `;
    
    const result = await structuredModel.invoke([
        new SystemMessage(`You are the Chief Profiler. Output structured JSON matching the schema exactly. Speak in ${state.lang}.`),
        new HumanMessage(prompt)
    ]);

    return { finalProfile: result };
};

const graph = new StateGraph(GraphState)
.addNode("cognitive", analyzeCognitive)
.addNode("clinical", analyzeClinical)
.addNode("values", analyzeValues)
.addNode("lie", analyzeLie)
.addNode("sexual", analyzeSexual)
.addNode("thinking", analyzeThinking)
.addNode("synthesis", synthesizeProfile)
.setEntryPoint("cognitive")
.addEdge("cognitive", "clinical")
.addEdge("clinical", "values")
.addEdge("values", "lie")
.addEdge("lie", "sexual")
.addEdge("sexual", "thinking")
.addEdge("thinking", "synthesis")
.addEdge("synthesis", END);

const compiledGraph = graph.compile();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { answers, config, lang } = body;
        
        console.log(`[API POST] Received request. Answers count: ${answers?.length}, Lang: ${lang}`);

        if (!answers) return NextResponse.json({ error: "No answers provided" }, { status: 400 });
        
        const result = await compiledGraph.invoke({ 
            answers, 
            config: config || {}, 
            lang: lang || 'zh' 
        });
        return NextResponse.json(result.finalProfile);
        
    } catch (e: any) {
        console.error("[API Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
