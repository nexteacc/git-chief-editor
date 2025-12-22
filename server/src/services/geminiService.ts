import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DailyReport, RepoActivity, SummaryStyle, RepoDuration } from '../types.js';

const MAX_PR_BODY_LENGTH = 5000;
const MAX_COMMITS_PER_REPO = 500;
const MAX_PRS_PER_REPO = 500;

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: {
      type: Type.STRING,
      description: "一个吸引人的、高度概括的今日工作总结（最多10个字）。",
    },
    keyAchievements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5个要点，突出所有仓库中最重要的成就。",
    },
    repoSummaries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          repoName: { type: Type.STRING },
          summary: { type: Type.STRING, description: "一段话总结这个仓库的工作内容。" },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3个简短标签，如'重构'、'功能'、'修复'、'文档'等。"
          },
        },
        required: ["repoName", "summary", "tags"],
      },
    },
  },
  required: ["headline", "keyAchievements", "repoSummaries"],
};

export const generateDailyReport = async (
  activities: RepoActivity[],
  style: SummaryStyle
): Promise<DailyReport> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in server environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let styleInstruction = "";
  switch (style) {
    case SummaryStyle.PROFESSIONAL:
      styleInstruction = "风格：简洁专业。使用商务导向的动词（完成、修复、部署）。聚焦结果，保持简洁。";
      break;
    case SummaryStyle.TECHNICAL:
      styleInstruction = "风格：技术深度分析。使用精确的技术术语。如果能够推断，提及具体的模块、架构变更或重构模式。";
      break;
    case SummaryStyle.ACHIEVEMENT:
      styleInstruction = "风格：成就突出。语调应该充满热情。突出工作的影响和难度。";
      break;
  }

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

  const prompt = `
    你是 Today Git Chief Editor，开发者的个人编辑助手。
    请分析以下过去24小时的 GitHub 活动数据。

    ${styleInstruction}

    数据：
    ${JSON.stringify(dataInput, null, 2)}

    请严格按照 schema 生成 JSON 响应。所有内容必须使用中文。
  `;

  try {
    console.log('[Gemini Service] Generating report...');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        systemInstruction: "你是一位专业的技术写作专家，擅长总结软件开发日志。请使用中文回答，确保所有输出内容都是中文。",
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

    console.log('[Gemini Service] Report generated successfully.');

    return {
      ...parsed,
      date: new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      totalCommits,
      totalPRs,
      style,
      repoDurations,
    };

  } catch (error) {
    console.error("[Gemini Service] Generation Error:", error);
    throw new Error("Failed to generate AI report. Please try again.");
  }
};
