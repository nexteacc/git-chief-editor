import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DailyReport, RepoActivity, SummaryStyle, OutputLanguage, RepoDuration } from '../types.js';

const MAX_PR_BODY_LENGTH = 5000;
const MAX_COMMITS_PER_REPO = 500;
const MAX_PRS_PER_REPO = 500;

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: {
      type: Type.STRING,
      description: "A catchy, high-level summary of today's work (max 10 words).",
    },
    keyAchievements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 key points highlighting the most important achievements across all repositories.",
    },
    repoSummaries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          repoName: { type: Type.STRING },
          summary: { type: Type.STRING, description: "A paragraph summarizing the work done in this repository." },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 short tags like 'refactor', 'feature', 'bugfix', 'docs', etc."
          },
        },
        required: ["repoName", "summary", "tags"],
      },
    },
  },
  required: ["headline", "keyAchievements", "repoSummaries"],
};

const SYSTEM_INSTRUCTION = `You are a professional technical writer who specializes in summarizing software development logs. Generate clear, insightful daily reports based on GitHub activity data. Focus on meaningful achievements and avoid trivial details.`;

const getStyleInstruction = (style: SummaryStyle): string => {
  switch (style) {
    case SummaryStyle.PROFESSIONAL:
      return "Use a concise, professional tone. Employ business-oriented verbs (completed, fixed, deployed, implemented). Focus on results and keep it brief.";
    case SummaryStyle.TECHNICAL:
      return "Provide technical depth and analysis. Use precise technical terminology. When possible, mention specific modules, architectural changes, or refactoring patterns.";
    case SummaryStyle.ACHIEVEMENT:
      return "Highlight achievements with an enthusiastic tone. Emphasize the impact and complexity of the work. Celebrate progress and milestones.";
  }
};

const getLanguageInstruction = (language: OutputLanguage): string => {
  switch (language) {
    case OutputLanguage.CHINESE:
      return "Output all content must be in Simplified Chinese.";
    case OutputLanguage.ENGLISH:
      return "Output all content must be in English.";
    case OutputLanguage.JAPANESE:
      return "Output all content must be in Japanese.";
    case OutputLanguage.KOREAN:
      return "Output all content must be in Korean.";
    case OutputLanguage.FRENCH:
      return "Output all content must be in French.";
    case OutputLanguage.GERMAN:
      return "Output all content must be in German.";       
    case OutputLanguage.SPANISH:
      return "Output all content must be in Spanish.";
    default:
      return "Output all content must be in English.";
  }
};

export const generateDailyReport = async (
  activities: RepoActivity[],
  style: SummaryStyle,
  language: OutputLanguage
): Promise<DailyReport> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in server environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const limitedActivities = activities.map((repo) => ({
    ...repo,
    commits: repo.commits.slice(0, MAX_COMMITS_PER_REPO),
    prs: repo.prs.slice(0, MAX_PRS_PER_REPO),
  }));

  const dataInput = limitedActivities.map((repo) => ({
    repo: repo.repoName,
    commits: repo.commits.map((c) => c.message),
    prs: repo.prs.map((p) => ({
      title: p.title,
      description: p.body?.substring(0, MAX_PR_BODY_LENGTH),
    })),
  }));

  const prompt = `## Role
You are "Today VibeEditor", a personal editor assistant for developers.

## Task
Analyze the following GitHub activity and generate a  work summary report.

## Style Guidelines
${getStyleInstruction(style)}

## Output Language
${getLanguageInstruction(language)}

## Activity Data
${JSON.stringify(dataInput, null, 2)}

## Requirements
- Follow the provided JSON schema strictly
- Be concise yet informative
- Focus on meaningful achievements over trivial changes
- Group related work logically
- Use appropriate technical terminology`;

  try {
    console.log('[Gemini Service] Generating report...');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    const parsed = JSON.parse(text);

    const totalCommits = activities.reduce((acc, r) => acc + r.commits.length, 0);
    const totalPRs = activities.reduce((acc, r) => acc + r.prs.length, 0);

    const repoDurations: RepoDuration[] = activities.map((repo) => {
      const commitCount = repo.commits.length;

      if (!commitCount) {
        return {
          repoName: repo.repoName,
          durationMinutes: 0,
          commitCount: 0,
        };
      }

      const timestamps = repo.commits
        .map((c) => new Date(c.timestamp).getTime())
        .filter((t) => !Number.isNaN(t))
        .sort((a, b) => a - b);

      if (!timestamps.length) {
        return {
          repoName: repo.repoName,
          durationMinutes: 0,
          commitCount,
        };
      }

      const durationMs = timestamps[timestamps.length - 1] - timestamps[0];
      const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

      return {
        repoName: repo.repoName,
        durationMinutes,
        commitCount,
      };
    });

    // Format date based on language
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    let locale = 'en-US';
    switch (language) {
      case OutputLanguage.CHINESE: locale = 'zh-CN'; break;
      case OutputLanguage.JAPANESE: locale = 'ja-JP'; break;
      case OutputLanguage.KOREAN: locale = 'ko-KR'; break;
      case OutputLanguage.FRENCH: locale = 'fr-FR'; break;
      case OutputLanguage.GERMAN: locale = 'de-DE'; break;
      case OutputLanguage.SPANISH: locale = 'es-ES'; break;
      default: locale = 'en-US';
    }
    
    const formattedDate = new Date().toLocaleDateString(locale, dateOptions);

    console.log('[Gemini Service] Report generated successfully.');

    return {
      ...parsed,
      date: formattedDate,
      totalCommits,
      totalPRs,
      style,
      repoDurations,
    };

  } catch (error) {
    console.error("[Gemini Service] Generation Error Details:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error("[Gemini Service] Error Message:", error.message);
      console.error("[Gemini Service] Error Stack:", error.stack);
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("Failed to generate AI report due to an unknown error.");
  }
};
