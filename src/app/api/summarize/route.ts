import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);

export async function POST(request: Request) {
  try {
    const { tasks } = await request.json();

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ summary: "No tasks to summarize. Add some tasks first!" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format tasks for the AI to read easily
    const taskList = tasks.map((t: any) => `- [${t.status}] ${t.title}`).join("\n");

    const prompt = `
      You are a highly productive project manager. 
      Look at the user's current task list below. 
      Provide a brief, 2-sentence motivational summary of their workload, 
      and suggest the ONE most important thing they should focus on next.
      
      Task List:
      ${taskList}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return NextResponse.json({ summary });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ summary: "Failed to generate AI summary. Check API key." }, { status: 500 });
  }
}
