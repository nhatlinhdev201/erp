import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { checkReadEndpointLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_PROMPTS } from "@/lib/cost-optimization/ai-prompts";
import {
  buildAIContext,
  formatContextForAI,
} from "@/lib/cost-optimization/ai-context";

const anthropic = new Anthropic();

export const POST = withAuth(async (request, _context, _session) => {
  const rateLimitResult = await checkReadEndpointLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const { type, partName } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Recommendation type required" },
        { status: 400 }
      );
    }

    // Build context
    const context = await buildAIContext();
    const contextString = formatContextForAI(context);

    // Get the appropriate prompt
    let userPrompt: string;
    switch (type) {
      case "topOpportunities":
        userPrompt = ANALYSIS_PROMPTS.topOpportunities;
        break;
      case "makeVsBuy":
        if (!partName) {
          return NextResponse.json(
            { error: "Part name required for Make vs Buy analysis" },
            { status: 400 }
          );
        }
        userPrompt = ANALYSIS_PROMPTS.makeVsBuyAdvice(partName);
        break;
      case "substitute":
        if (!partName) {
          return NextResponse.json(
            { error: "Part name required for substitute search" },
            { status: 400 }
          );
        }
        userPrompt = ANALYSIS_PROMPTS.substituteSearch(partName);
        break;
      case "progress":
        userPrompt = ANALYSIS_PROMPTS.progressReport;
        break;
      case "compliance":
        userPrompt = ANALYSIS_PROMPTS.complianceStatus;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid recommendation type" },
          { status: 400 }
        );
    }

    const systemPrompt = `Ban la AI Cost Advisor cua L-ERP. Dua tren du lieu thuc te duoc cung cap, hay phan tich va dua ra khuyen nghi cu the.

## CONTEXT
${contextString}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return NextResponse.json({
      type,
      recommendation: content,
      context: {
        autonomyPercent: context.autonomyStatus?.autonomyPercent,
        ytdSavings: context.recentSavings?.ytdTotal,
        activeTargets: context.activeTargets?.length || 0,
      },
    });
  } catch (error) {
    logger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { context: "POST /api/cost-optimization/ai/recommend" }
    );
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
});
