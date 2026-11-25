import { Router, type Request, type Response } from "express";
import { streamChatResponse } from "../services/geminiService.js";
import { validate, ChatRequestSchema } from "../middleware/validate.js";
import { chatRateLimiter } from "../middleware/rateLimiter.js";
import type { ChatRequest } from "../types/index.js";

const router = Router();

/**
 * POST /api/chat
 * Streams Gemini response as Server-Sent Events (SSE)
 */
router.post(
  "/",
  chatRateLimiter,
  validate(ChatRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { message, previousInteractionId, profile, aqiData } =
      req.body as ChatRequest;

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
      const stream = streamChatResponse(
        message,
        previousInteractionId,
        profile,
        aqiData
      );

      for await (const chunk of stream) {
        if (chunk.type === "delta" && chunk.text) {
          res.write(
            `data: ${JSON.stringify({ type: "delta", text: chunk.text })}\n\n`
          );
        } else if (chunk.type === "done") {
          res.write(
            `data: ${JSON.stringify({ type: "done", interactionId: chunk.interactionId })}\n\n`
          );
          res.end();
          return;
        } else if (chunk.type === "error") {
          res.write(
            `data: ${JSON.stringify({ type: "error", text: chunk.text })}\n\n`
          );
          res.end();
          return;
        }
      }

      res.end();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stream failed";
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: message });
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", text: message })}\n\n`);
        res.end();
      }
    }
  }
);

export default router;
