import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "AS PulseWork",
    company: "AS Creative Media",
    timestamp: new Date().toISOString(),
  });
});

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint: AI-Powered Productivity & Anomaly Intelligence
app.post("/api/gemini/insights", async (req, res) => {
  try {
    const { attendanceSummary, employees, anomalies, timeRange } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured in the server environment.",
      });
    }

    const prompt = `You are an expert Chief People Officer & Workforce Productivity Analyst.
Analyze the following corporate attendance, break, and activity telemetry dataset:

Timeframe: ${timeRange || "Current Period"}
Summary Metrics: ${JSON.stringify(attendanceSummary || {})}
Flagged Anomalies / Exceptions: ${JSON.stringify(anomalies || [])}
Sample Employee Activity: ${JSON.stringify(employees || [])}

Provide a high-impact, professional workforce intelligence brief containing:
1. Executive Summary (2-3 sentences assessing overall team health, attendance consistency, and work-life balance).
2. Key Operational Insights (3 bullet points highlighting trends, punctuality patterns, or break balance).
3. Risk & Anomaly Flags (e.g. chronic late check-ins, excessive unpaid break overages, or missing check-out burnout indicators).
4. Actionable Management Recommendations (3 concrete action items for managers/business owners).

Write in crisp, constructive, business-executive tone. Avoid robotic clichés. Format cleanly with clear headers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an executive enterprise workforce analytics consultant.",
      },
    });

    res.json({
      success: true,
      insightText: response.text || "No analysis generated.",
    });
  } catch (error: any) {
    console.error("Gemini Insights Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate AI insights from Gemini.",
    });
  }
});

// Endpoint: Automated Employee Performance & Attendance Review
app.post("/api/gemini/employee-review", async (req, res) => {
  try {
    const { employee, attendanceRecords, breakStats } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured in the server environment.",
      });
    }

    const prompt = `Generate a concise, constructive attendance and work-habit performance summary for employee:
Employee: ${employee?.name} (${employee?.designation}, Department: ${employee?.department})
Scheduled Hours/day: ${employee?.dailyWorkingHours || 8}h
Attendance Stats: ${JSON.stringify(attendanceRecords || {})}
Break Stats: ${JSON.stringify(breakStats || {})}

Provide:
1. Attendance Consistency Rating (Punctuality, Net Working Hours compliance)
2. Commendable Strengths
3. Areas for Improvement (e.g., break adherence, timely check-outs)
4. Recommended coaching note from Manager.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an empathetic, fair, and professional HR and talent operations specialist.",
      },
    });

    res.json({
      success: true,
      reviewText: response.text || "No review generated.",
    });
  } catch (error: any) {
    console.error("Gemini Employee Review Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate employee review.",
    });
  }
});

// Start server with Vite middleware in development
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
