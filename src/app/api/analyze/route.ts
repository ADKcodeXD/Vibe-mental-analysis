import { NextRequest, NextResponse } from 'next/server';
import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { Annotation } from '@langchain/langgraph';

export const maxDuration = 300; // 5 minutes for long-running reasoning
export const dynamic = 'force-dynamic';

// Load language data
import questionsZh from "@/data/assessments/identity-mirror/zh.json";
import questionsEn from "@/data/assessments/identity-mirror/en.json";
import questionsJa from "@/data/assessments/identity-mirror/ja.json";

const questionsDataMap: Record<string, any> = {
    zh: questionsZh,
    en: questionsEn,
    ja: questionsJa
};

// Helper to lookup question text and metadata
const getQuestionMetadata = (id: string, lang: string = 'zh') => {
    const data = questionsDataMap[lang] || questionsDataMap['zh'];
    for (const section of data.sections) {
        const q = section.questions.find((q: any) => q.id === id);
        if (q) return q;
    }
    // Fallback search across all languages if not found in requested
    for (const l of Object.keys(questionsDataMap)) {
        for (const section of questionsDataMap[l].sections) {
            const q = section.questions.find((q: any) => q.id === id);
            if (q) return q;
        }
    }
    return null;
};

const getQuestionText = (id: string, lang: string = 'zh') => {
    const q = getQuestionMetadata(id, lang);
    if (!q) return id;
    
    let text = q.text;
    if (q.type === 'scale' && q.leftLabel && q.rightLabel) {
        text += ` (Scale: ${q.leftLabel} vs ${q.rightLabel})`;
    }
    return text;
};

// --- Zod Schemas ---
// ... (ScoreSchema, DimensionSchema, FinalProfileSchema remain the same)
const ScoreSchema = z.object({
    score: z.number().min(0).max(100).describe("0-100 score, where 100 is maximum intensity of the trait"),
    level: z.string().describe("Qualitative level based on score (e.g., 'Low', 'Medium', 'High' in the requested language)"),
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
            type: z.string().describe("The localized name of the attachment style (e.g. '安全型', '焦虑型', '回避型', '恐惧型')"),
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
        circle_breakdown: z.object({
            deep_connections: z.string(),
            casual_friends: z.string(),
            useless_connections: z.string()
        }).optional()
    }).optional().describe("Only provide if there is sufficient data about social patterns"),
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
    }),
    integrity_analysis: z.object({
        consistency_score: z.number().describe("0-100 score of how consistent the answers were across different sections"),
        verdict: z.string().describe("Brief qualitative verdict, e.g. 'Highly Authentic', 'Slightly Contradictory', 'Highly Deceptive'"),
        conflicts: z.array(z.string()).describe("List of 2-3 specific contradictions found, if any")
    })
});

// --- Types ---
type Answer = { questionId: string; value: string };
type AgentState = {
  answers: Answer[];
  config: { apiKey?: string; baseUrl?: string; model?: string };
  comprehensiveAnalysis: string;
  finalProfile: any;
  lang: string;
};

const createModel = (config?: { apiKey?: string; baseUrl?: string; model?: string }, temperature: number = 0.1) => {
    const clean = (val: string | undefined) => val?.trim().replace(/^["']|["']$/g, '').trim();

    const apiKey = (config?.apiKey && config.apiKey.trim() !== '') ? clean(config.apiKey) : clean(process.env.OPENAI_API_KEY);
    const baseUrl = (config?.baseUrl && config.baseUrl.trim() !== '') ? clean(config.baseUrl) : clean(process.env.OPENAI_BASE_URL);
    const modelName = (config?.model && config.model.trim() !== '') ? clean(config.model) : (clean(process.env.LLM_MODEL) || 'google/gemini-2.0-flash-001');

    return new ChatOpenAI({
        apiKey: apiKey,
        openAIApiKey: apiKey,
        modelName: modelName,
        configuration: {
            baseURL: baseUrl || undefined,
            // @ts-ignore
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
        maxRetries: 1,
        timeout: 300000 // 5 minutes
    });
};

// --- Graph Definition ---

const GraphState = Annotation.Root({
  answers: Annotation<Answer[]>({ reducer: (x, y) => y, default: () => [] }),
  config: Annotation<any>({ reducer: (x, y) => y, default: () => ({}) }),
  comprehensiveAnalysis: Annotation<string>({ reducer: (x, y) => y, default: () => "" }),
  finalProfile: Annotation<any>({ reducer: (x, y) => y, default: () => ({}) }),
  lang: Annotation<string>({ reducer: (x, y) => y, default: () => "zh" })
});

// NODES
const runDeepAnalysis = async (state: AgentState) => {
    const model = createModel(state.config);
    
    // Check available categories
    const categories = {
        mbti: state.answers.some(a => a.questionId.startsWith('mbti_')),
        values: state.answers.some(a => a.questionId.startsWith('val_') || a.questionId.startsWith('soc_')),
        clinical: state.answers.some(a => ['phq9', 'gad7', 'mdq', 'att_', 'beh_'].some(p => a.questionId.startsWith(p))),
        sexual: state.answers.some(a => a.questionId.startsWith('sex_')),
        thinking: state.answers.some(a => a.questionId.startsWith('think_'))
    };

    // Format context
    const context = state.answers.map(a => {
        const q = getQuestionMetadata(a.questionId, state.lang);
        let text = q ? q.text : a.questionId;
        let line = `Q: ${text}`;
        
        if (q?.type === 'scale') {
            line += `\nScale: [1: ${q.leftLabel}] to [7: ${q.rightLabel}]`;
            line += `\nUser Selection: ${a.value}`;
        } else if (q?.type === 'choice' && q.options) {
            const optionsList = q.options.map((o: any) => typeof o === 'object' ? (o[state.lang] || o['zh']) : o).join(', ');
            line += `\nAvailable Options: [${optionsList}]`;
            line += `\nUser Selection: ${a.value}`;
        } else {
            line += `\nA: ${a.value}`;
        }
        return line;
    }).join('\n\n');

    // Build conditional instructions
    let specificInstructions = "";
    if (categories.mbti) {
        specificInstructions += `\n- COGNITIVE: Analyze MBTI (E/I, S/N, T/F, J/P). 1-7 scale: 1=Fully Left, 4=Neutral, 7=Fully Right.`;
    }
    if (categories.values) {
        specificInstructions += `\n- VALUES: Analyze Economic, Diplomatic, Civil, Societal leanings. 1=Strongly Disagree/Left, 7=Strongly Agree/Right.`;
    }
    if (categories.clinical) {
        let riskFlag = "";
        const risk_q = state.answers.find(a => a.questionId === 'phq9_9_risk');
        if (risk_q && (risk_q.value === "6" || risk_q.value === "7" || risk_q.value.includes("几乎每天") || risk_q.value.includes("一半以上") || risk_q.value.includes("Almost every day"))) {
            riskFlag = "CRITICAL: SUICIDE IDEATION DETECTED in Q9.";
        }
        
        specificInstructions += `\n- CLINICAL: 
          1. PHQ-9: Assess depression (1=Not at all, 7=Nearly every day). 
          2. BEHAVIOR: Detect Narcissism, ADHD, Anxiety. 
          3. ATTACHMENT: Determine style.
          4. SAFETY: ${riskFlag ? riskFlag + " MUST include a warning." : "Standard safety monitoring."}`;
    }
    if (categories.sexual) {
        specificInstructions += `\n- SEXUAL: Analyze repression, guilt, and desire. 1=None/Free, 7=Extreme/Repressed.`;
    }
    if (categories.thinking) {
        specificInstructions += `\n- INDEPENDENT THINKING: Analyze conformity and critical thinking depth. 1=Wolf/Independent, 7=Sheep/Conformist.`;
    }

    const systemPrompt = `You are a Master Psychologist and Profiler. 
Analyze the user's questionnaire answers comprehensively. 
IMPORTANT: Only analyze categories mentioned below where data is available. If a category is not mentioned, DO NOT hallucinate.

DIMENSIONS TO ANALYZE:${specificInstructions}

INTEGRITY: Analyze inconsistencies or deceptive patterns across all provided answers.

Be granular, observant, and brutally honest. Provide a deep synthesis of their psyche.
Language: ${state.lang}.`;

    const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(context)
    ]);
    
    return { comprehensiveAnalysis: response.content as string };
};

const synthesizeProfile = async (state: AgentState) => {
    const model = createModel(state.config, 0.2); 
    const structuredModel = model.withStructuredOutput(FinalProfileSchema);
    
    const prompt = `
    GENERATE HOLOGRAPHIC PERSONALITY REPORT JSON.
    
    [ANALYSIS DATA]
    ${state.comprehensiveAnalysis}
    
    [RAW INPUTS]
    ${state.answers.map(a => `Q: ${getQuestionText(a.questionId, state.lang)}\nA: ${a.value}`).join('\n')}

    REQUIREMENTS:
    1.  **Roast & Insight**: Be brutally honest yet scientifically accurate. High-level psychoanalysis.
    2.  **Stats & Scores**: Calculate 0-100 scores logically based on the 1-7 scales and scenario choices.
    3.  **Dimensions**: Fill Political Compass dimensions (0-100).
    4.  **Clinical**: Map depression, anxiety, ADHD, narcissism, and sexual_repression to scores and levels.
    5.  **Attachment**: Identify and localize the attachment style.
    6.  **Language**: CRITICAL: ALL string fields in the JSON (labels, levels, archetypes, etc.) MUST be in ${state.lang}.
    7.  **Integrity**: Analyze consistency and provide a verdict.
    8.  **Output**: Pure JSON only. No markdown formatting.
    `;
    
    const result = await structuredModel.invoke([
        new SystemMessage(`You are the Chief Profiler. Output structured JSON matching the schema exactly. Speak in ${state.lang}. NO Markdown.`),
        new HumanMessage(prompt)
    ]);

    return { finalProfile: result };
};

const graph = new StateGraph(GraphState)
    .addNode("analysis", runDeepAnalysis)
    .addNode("synthesis", synthesizeProfile)
    .setEntryPoint("analysis")
    .addEdge("analysis", "synthesis")
    .addEdge("synthesis", END);

const compiledGraph = graph.compile();

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();
    
    try {
        const body = await req.json();
        const { answers, config, lang = 'zh' } = body;
        
        if (!answers && !body.test) return NextResponse.json({ error: "No answers provided" }, { status: 400 });

        if (body.test) {
            const model = createModel(config);
            const response = await model.invoke([new HumanMessage("Hello")]);
            return NextResponse.json({ status: "success", response: response.content });
        }

        const stream = new ReadableStream({
            async start(controller) {
                const send = (type: string, data: any) => {
                    controller.enqueue(encoder.encode(JSON.stringify({ type, data }) + '\n'));
                };

                try {
                    const model = createModel(config);
                    
                    // 1. Prepare Context
                    const categories = {
                        mbti: answers.some((a: any) => a.questionId.startsWith('mbti_')),
                        values: answers.some((a: any) => a.questionId.startsWith('val_') || a.questionId.startsWith('soc_')),
                        clinical: answers.some((a: any) => ['phq9', 'gad7', 'mdq', 'att_', 'beh_'].some(p => a.questionId.startsWith(p))),
                        sexual: answers.some((a: any) => a.questionId.startsWith('sex_')),
                        thinking: answers.some((a: any) => a.questionId.startsWith('think_'))
                    };

                    const context = answers.map((a: any) => {
                        const q = getQuestionMetadata(a.questionId, lang);
                        let line = `Q: ${q?.text || a.questionId}`;
                        if (q?.type === 'scale') {
                            line += `\nScale: [1: ${q.leftLabel}] to [7: ${q.rightLabel}]\nUser Selection: ${a.value}`;
                        } else if (q?.type === 'choice' && q.options) {
                            const optionsList = q.options.map((o: any) => typeof o === 'object' ? (o[lang] || o['zh']) : o).join(', ');
                            line += `\nAvailable Options: [${optionsList}]\nUser Selection: ${a.value}`;
                        } else {
                            line += `\nA: ${a.value}`;
                        }
                        return line;
                    }).join('\n\n');

                    let specificInstructions = "";
                    if (categories.mbti) specificInstructions += `\n- COGNITIVE: Analyze MBTI (E/I, S/N, T/F, J/P).`;
                    if (categories.values) specificInstructions += `\n- VALUES: Analyze Economic, Diplomatic, Civil, Societal leanings.`;
                    if (categories.clinical) {
                        const risk_q = answers.find((a: any) => a.questionId === 'phq9_9_risk');
                        const isRisk = risk_q && (risk_q.value === "6" || risk_q.value === "7" || risk_q.value.includes("几乎每天"));
                        specificInstructions += `\n- CLINICAL: Depression, Behavior (Narcissism, ADHD, Anxiety), Attachment style. ${isRisk ? 'CRITICAL: Suicide ideation detected.' : ''}`;
                    }
                    if (categories.sexual) specificInstructions += `\n- SEXUAL: Analyze repression and desire.`;
                    if (categories.thinking) specificInstructions += `\n- INDEPENDENT THINKING: Analyze conformity and critical thinking depth.`;

                    const systemPrompt = `You are a Master Psychologist. Analyze these dimensions:${specificInstructions}\nIntegrity: Analyze inconsistencies.\nBe granular and brutally honest. Language: ${lang}.`;

                    // 2. Stream Deep Analysis
                    send('status', 'Analyzing patterns...');
                    let comprehensiveAnalysis = "";
                    const analysisStream = await model.stream([
                        new SystemMessage(systemPrompt),
                        new HumanMessage(context)
                    ]);

                    for await (const chunk of analysisStream) {
                        const content = chunk.content as string;
                        comprehensiveAnalysis += content;
                        send('chunk', content);
                    }

const JSON_TEMPLATE = `{
"identity_card": { "archetype": "", "one_liner": "", "mbti": "", "alignment": "", "ideology": "", "personality_tags": [], "clinical_label": "", "clinical_explanation": "" },
"clinical_findings": { 
  "depression": { "score": 0, "level": "", "explanation": "" },
  "anxiety": { "score": 0, "level": "", "explanation": "" },
  "adhd": { "score": 0, "level": "", "explanation": "" },
  "narcissism": { "score": 0, "level": "", "explanation": "" },
  "sexual_repression": { "score": 0, "level": "", "explanation": "" },
  "attachment": { "type": "", "description": "" } 
},
"scores": { "repression_index": 0, "happiness_index": 0, "social_adaptation": 0, "independent_thinking": 0, "consistency_score": 0 },
"dimensions": { 
  "economic": { "label": "", "value": 50, "axis_label": "Equality vs Markets" },
  "diplomatic": { "label": "", "value": 50, "axis_label": "Nation vs Globe" },
  "civil": { "label": "", "value": 50, "axis_label": "Authority vs Liberty" },
  "societal": { "label": "", "value": 50, "axis_label": "Tradition vs Progress" }
},
"career_analysis": { "strengths": [], "weaknesses": [], "suitable_careers": [], "workplace_advice": "" },
"social_analysis": { "overview": "", "circle_breakdown": { "deep_connections": "", "casual_friends": "", "useless_connections": "" } },
"highlights": { "talents": [], "liabilities": [] },
"celebrity_match": { "name": "", "reason": "" },
"analysis": { "strengths": "", "dark_side": "", "ideology_note": "", "clinical_note": "", "advice": "" },
"integrity_analysis": { "consistency_score": 0, "verdict": "", "conflicts": [] }
}`;

                    // 3. Synthesize structured report
                    send('status', 'Synthesizing final report...');
                    
                    const synthesisPromptBody = `
                    GENERATE HOLOGRAPHIC PERSONALITY REPORT JSON.
                    [ANALYSIS DATA] ${comprehensiveAnalysis}
                    [RAW INPUTS] ${answers.map((a: any) => {
                        const q = getQuestionMetadata(a.questionId, lang);
                        return `Q: ${q?.text || a.questionId}\nA: ${a.value}`;
                    }).join('\n')}
                    
                    STRICT REQUIREMENTS: 
                    1. Use EXACTLY this JSON structure: ${JSON_TEMPLATE}
                    2. Language: ${lang}. 
                    3. Brutally honest, granular, and slightly clinical yet poetic.
                    4. NO placeholders like "Analyzing...", fill EVERY field with real data.
                    5. Output ONLY raw JSON. NO markdown.
                    `;
                    
                    const metaModel = createModel(config, 0.2); 
                    const synthesisStream = await metaModel.stream([
                        new SystemMessage(`You are the Chief Profiler. Output structured JSON. Speak in ${lang}. NO Markdown blocks, just raw JSON.`),
                        new HumanMessage(synthesisPromptBody)
                    ]);

                    let fullJsonText = "";
                    for await (const chunk of synthesisStream) {
                        const content = chunk.content as string;
                        fullJsonText += content;
                        send('chunk', content);
                    }

                    // Extract and parse JSON
                    let cleaned = fullJsonText.trim();
                    if (cleaned.includes('```')) {
                        const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
                        if (match) cleaned = match[1].trim();
                    }
                    
                    try {
                        const finalProfile = JSON.parse(cleaned);
                        // Basic validation - ensure identity_card exists
                        if (!finalProfile.identity_card) throw new Error("Incomplete JSON");
                        send('final', finalProfile);
                    } catch (parseError) {
                        console.error("JSON Parse Error, trying fallback structured output...", parseError);
                        const fallbackModel = createModel(config, 0.2).withStructuredOutput(FinalProfileSchema);
                        const fallbackResult = await fallbackModel.invoke([
                            new SystemMessage(`Output structured JSON. Speak in ${lang}.`),
                            new HumanMessage(synthesisPromptBody)
                        ]);
                        send('final', fallbackResult);
                    }
                    controller.close();
                } catch (err: any) {
                    send('error', err.message);
                    controller.error(err);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
