import { NextResponse } from "next/server";
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: Request) {
  try {
    const { messages, systemPrompt } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages are required and must be an array" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are a helpful assistant specialized in software development and coding. Provide clear, concise, and accurate responses to programming questions.'
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      return NextResponse.json(
        { error: "No response received from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: messageContent,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}