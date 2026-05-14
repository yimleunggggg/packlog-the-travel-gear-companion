import { createFileRoute } from "@tanstack/react-router";
import { handleAiAction } from "@/lib/ai-route-handlers";

export const Route = createFileRoute("/api/ai/$action")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const action = params.action;
        const body = await request.json().catch(() => ({}));
        return handleAiAction(action, body);
      },
    },
  },
});
