from langgraph.types import interrupt


class HumanAgent:
    def __init__(self, websocket=None, stream_output=None, headers=None):
        self.websocket = websocket
        self.stream_output = stream_output
        self.headers = headers or {}

    async def review_plan(self, research_state: dict):
        task = research_state.get("task")
        plan_revision_count = research_state.get("plan_revision_count", 0)
        layout = research_state.get("sections") or []

        if not task.get("include_human_feedback"):
            return {
                "human_feedback": None,
                "plan_revision_count": plan_revision_count,
            }

        review_request = {
            "type": "plan_review",
            "message": "研究大纲已生成，请确认或补充修改意见。",
            "title": research_state.get("title") or task.get("query"),
            "sections": layout,
            "revision_count": plan_revision_count,
        }

        user_response = interrupt(review_request)

        user_feedback = None
        if isinstance(user_response, str):
            normalized_feedback = user_response.strip()
            if normalized_feedback and normalized_feedback.lower() != "no":
                user_feedback = normalized_feedback
        elif isinstance(user_response, dict):
            action = (user_response.get("action") or "approve").strip().lower()
            normalized_feedback = (user_response.get("feedback") or "").strip()
            if action in {"revise", "edit"} and normalized_feedback:
                user_feedback = normalized_feedback
            elif action not in {"approve", "accept"} and normalized_feedback:
                user_feedback = normalized_feedback

        if user_feedback:
            plan_revision_count += 1

        return {
            "human_feedback": user_feedback,
            "plan_revision_count": plan_revision_count,
        }
