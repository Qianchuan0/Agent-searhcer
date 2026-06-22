import json
import re
from typing import Any

from gpt_researcher.config import Config
from gpt_researcher.utils.llm import create_chat_completion


def _extract_json_block(raw_text: str) -> dict[str, Any] | None:
    if not raw_text:
        return None

    text = raw_text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _fallback_clarification(query: str) -> dict[str, Any]:
    return {
        "query": query,
        "prompt": "我先帮你做了初步问题拆分，请确认这次研究更偏向哪些方向。",
        "can_skip": True,
        "sections": [
            {
                "id": "focus",
                "title": "你最希望优先回答什么",
                "description": "选择最关键的研究目标，帮助缩小范围。",
                "multiple": True,
                "required": False,
                "options": [
                    {"id": "definition", "label": "基础定义与背景脉络"},
                    {"id": "comparison", "label": "同类产品或竞品对比"},
                    {"id": "market", "label": "市场表现与用户反馈"},
                    {"id": "business", "label": "商业模式与发展趋势"},
                ],
            },
            {
                "id": "output",
                "title": "你更期待这份报告的输出方式",
                "description": "帮助调整报告结构和重点。",
                "multiple": False,
                "required": False,
                "options": [
                    {"id": "overview", "label": "先给全局概览"},
                    {"id": "deepdive", "label": "直接深挖核心问题"},
                    {"id": "decision", "label": "面向决策的结论建议"},
                ],
            },
        ],
        "free_text_label": "补充说明",
        "free_text_placeholder": "可补充行业、时间范围、竞品名单、输出偏好等信息",
    }


async def generate_clarification_payload(query: str) -> dict[str, Any]:
    cfg = Config("default")
    messages = [
        {
            "role": "system",
            "content": (
                "你是一个研究任务澄清助手。"
                "你需要根据用户问题，输出一组用于确认研究方向的结构化选项卡。"
                "必须返回合法 JSON，不要输出 markdown，不要输出解释。"
            ),
        },
        {
            "role": "user",
            "content": (
                "请基于下面这个研究需求，生成 2 到 3 组研究澄清选项，帮助用户在正式启动研究前确认方向。\n\n"
                "要求：\n"
                "1. 选项必须具体、可点击、中文输出。\n"
                "2. 每组 3 到 5 个选项。\n"
                "3. 尽量覆盖“研究对象归类 / 重点维度 / 输出偏好”这类方向。\n"
                "4. 如果原问题已经很明确，也仍然给出可选增强项，但 can_skip 设为 true。\n"
                "5. 严格返回以下 JSON 结构：\n"
                "{\n"
                '  "query": "<原问题>",\n'
                '  "prompt": "<引导语>",\n'
                '  "can_skip": true,\n'
                '  "sections": [\n'
                "    {\n"
                '      "id": "section_id",\n'
                '      "title": "<分组标题>",\n'
                '      "description": "<分组说明>",\n'
                '      "multiple": true,\n'
                '      "required": false,\n'
                '      "options": [\n'
                '        {"id": "opt_1", "label": "<选项文案>"}\n'
                "      ]\n"
                "    }\n"
                "  ],\n"
                '  "free_text_label": "<补充输入标题>",\n'
                '  "free_text_placeholder": "<补充输入占位提示>"\n'
                "}\n\n"
                f"用户研究需求：{query}"
            ),
        },
    ]

    try:
        raw_response = await create_chat_completion(
            messages=messages,
            llm_provider=cfg.smart_llm_provider,
            model=cfg.smart_llm_model,
            temperature=0.3,
            max_tokens=min(cfg.smart_token_limit, 1800),
            llm_kwargs=cfg.llm_kwargs,
        )
        parsed = _extract_json_block(raw_response)
        if parsed and isinstance(parsed.get("sections"), list) and parsed["sections"]:
            parsed.setdefault("query", query)
            parsed.setdefault("can_skip", True)
            parsed.setdefault("free_text_label", "补充说明")
            parsed.setdefault("free_text_placeholder", "可补充业务背景、时间范围、竞品名单或特殊要求")
            return parsed
    except Exception:
        pass

    return _fallback_clarification(query)
