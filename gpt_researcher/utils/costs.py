"""Cost estimation utilities for LLM API usage."""

from __future__ import annotations

import logging
import os
from collections.abc import Mapping
from typing import Any

import tiktoken

# Generic tokenizer used for fallback estimation when the provider does not
# return token usage metadata.
ENCODING_MODEL = "o200k_base"

# OpenAI-compatible fallback pricing when no provider-specific pricing rule is
# available. Prices are in USD per token.
DEFAULT_INPUT_COST_PER_TOKEN = 0.000005
DEFAULT_OUTPUT_COST_PER_TOKEN = 0.000015
IMAGE_INFERENCE_COST = 0.003825
EMBEDDING_COST = 0.02 / 1_000_000  # Assumes text-embedding-3-small.

DEEPSEEK_PRICING_SOURCE = "DeepSeek official pricing (checked 2026-06-21)"
DEEPSEEK_MODEL_PRICING = (
    (("deepseek-v4-pro",), 0.003625, 0.435, 0.87),
    (
        (
            "deepseek-v4-flash",
            "deepseek-chat",
            "deepseek-reasoner",
        ),
        0.0028,
        0.14,
        0.28,
    ),
)

logger = logging.getLogger(__name__)

ANTHROPIC_MODEL_PRICING = (
    (("claude-opus-4-7",), 5.0, 25.0),
    (("claude-opus-4-6",), 5.0, 25.0),
    (("claude-opus-4-5", "claude-4-opus"), 5.0, 25.0),
    (("claude-opus-4-1",), 15.0, 75.0),
    (("claude-opus-4",), 15.0, 75.0),
    (("claude-sonnet-4-6",), 3.0, 15.0),
    (("claude-sonnet-4-5", "claude-4-sonnet"), 3.0, 15.0),
    (("claude-sonnet-4",), 3.0, 15.0),
    (("claude-haiku-4-5",), 1.0, 5.0),
    (("claude-3-5-haiku",), 0.8, 4.0),
)

ANTHROPIC_US_INFERENCE_GEO_MODELS = (
    "claude-opus-4-7",
    "claude-opus-4-6",
    "claude-sonnet-4-6",
)


def _mapping_to_dict(value: Mapping[str, Any] | Any | None) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, Mapping):
        return dict(value)
    if hasattr(value, "model_dump"):
        return dict(value.model_dump())
    return {}


def _safe_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _estimate_cost_from_content(
    input_content: str,
    output_content: str,
    *,
    input_cost_per_token: float,
    output_cost_per_token: float,
) -> float:
    encoding = tiktoken.get_encoding(ENCODING_MODEL)
    input_tokens = encoding.encode(input_content)
    output_tokens = encoding.encode(output_content)
    return (len(input_tokens) * input_cost_per_token) + (len(output_tokens) * output_cost_per_token)


def estimate_llm_cost(input_content: str, output_content: str) -> float:
    """Fallback estimator using generic OpenAI-compatible prices."""
    return _estimate_cost_from_content(
        input_content,
        output_content,
        input_cost_per_token=DEFAULT_INPUT_COST_PER_TOKEN,
        output_cost_per_token=DEFAULT_OUTPUT_COST_PER_TOKEN,
    )


def _resolve_anthropic_model_name(
    model: str | None,
    response_metadata: Mapping[str, Any] | None = None,
) -> str:
    metadata = _mapping_to_dict(response_metadata)
    return str(metadata.get("model") or metadata.get("model_name") or model or "").lower()


def _extract_anthropic_usage(
    response_metadata: Mapping[str, Any] | None = None,
    usage_metadata: Mapping[str, Any] | Any | None = None,
) -> dict[str, int] | None:
    metadata = _mapping_to_dict(response_metadata)
    usage = _mapping_to_dict(metadata.get("usage"))

    if usage:
        input_tokens = usage.get("input_tokens")
        output_tokens = usage.get("output_tokens")
        if input_tokens is not None and output_tokens is not None:
            return {
                "input_tokens": int(input_tokens),
                "output_tokens": int(output_tokens),
            }

    usage = _mapping_to_dict(usage_metadata)
    input_tokens = usage.get("input_tokens")
    output_tokens = usage.get("output_tokens")
    if input_tokens is None or output_tokens is None:
        return None

    return {
        "input_tokens": int(input_tokens),
        "output_tokens": int(output_tokens),
    }


def _get_anthropic_pricing(model_name: str) -> tuple[float, float] | None:
    normalized_model_name = model_name.lower()
    for patterns, input_price_per_mtok, output_price_per_mtok in ANTHROPIC_MODEL_PRICING:
        if any(pattern in normalized_model_name for pattern in patterns):
            return input_price_per_mtok, output_price_per_mtok
    return None


def _get_anthropic_pricing_multiplier(
    model_name: str,
    request_options: Mapping[str, Any] | None = None,
) -> float:
    if not request_options:
        return 1.0

    inference_geo = str(request_options.get("inference_geo", "")).lower()
    if inference_geo != "us":
        return 1.0

    if any(pattern in model_name for pattern in ANTHROPIC_US_INFERENCE_GEO_MODELS):
        return 1.1

    return 1.0


def calculate_anthropic_cost(
    model: str | None,
    response_metadata: Mapping[str, Any] | None = None,
    usage_metadata: Mapping[str, Any] | Any | None = None,
    request_options: Mapping[str, Any] | None = None,
) -> float | None:
    usage = _extract_anthropic_usage(response_metadata=response_metadata, usage_metadata=usage_metadata)
    if not usage:
        return None

    model_name = _resolve_anthropic_model_name(model=model, response_metadata=response_metadata)
    pricing = _get_anthropic_pricing(model_name)
    if pricing is None:
        logger.warning(
            "Missing Anthropic pricing rule for model '%s'; falling back to token estimator.",
            model_name or model,
        )
        return None

    input_price_per_mtok, output_price_per_mtok = pricing
    multiplier = _get_anthropic_pricing_multiplier(model_name, request_options=request_options)
    input_cost = usage["input_tokens"] * input_price_per_mtok / 1_000_000
    output_cost = usage["output_tokens"] * output_price_per_mtok / 1_000_000
    return (input_cost + output_cost) * multiplier


def _looks_like_deepseek_model(model: str | None) -> bool:
    normalized = str(model or "").lower()
    return normalized.startswith("deepseek") or normalized in {"deepseek-chat", "deepseek-reasoner"}


def _looks_like_deepseek_base_url(base_url: str | None) -> bool:
    return "api.deepseek.com" in str(base_url or "").lower()


def _resolve_effective_provider(
    llm_provider: str | None,
    model: str | None,
    request_options: Mapping[str, Any] | None = None,
) -> str | None:
    provider = str(llm_provider or "").lower() or None
    if provider == "deepseek":
        return "deepseek"

    options = _mapping_to_dict(request_options)
    openai_base_url = (
        options.get("openai_api_base")
        or options.get("base_url")
        or os.getenv("OPENAI_BASE_URL")
    )
    if provider == "openai" and (
        _looks_like_deepseek_model(model) or _looks_like_deepseek_base_url(str(openai_base_url))
    ):
        return "deepseek"

    return provider


def _get_deepseek_pricing(model: str | None) -> tuple[float, float, float] | None:
    normalized_model_name = str(model or "").lower()
    for patterns, cache_hit_per_mtok, input_per_mtok, output_per_mtok in DEEPSEEK_MODEL_PRICING:
        if any(pattern in normalized_model_name for pattern in patterns):
            return cache_hit_per_mtok, input_per_mtok, output_per_mtok
    return None


def _extract_openai_like_usage(
    response_metadata: Mapping[str, Any] | None = None,
    usage_metadata: Mapping[str, Any] | Any | None = None,
) -> dict[str, int] | None:
    metadata = _mapping_to_dict(response_metadata)
    usage = _mapping_to_dict(metadata.get("token_usage"))
    if not usage:
        usage = _mapping_to_dict(metadata.get("usage"))

    usage_fallback = _mapping_to_dict(usage_metadata)
    prompt_details = _mapping_to_dict(usage.get("prompt_tokens_details"))

    prompt_tokens = (
        _safe_int(usage.get("prompt_tokens"))
        or _safe_int(usage_fallback.get("input_tokens"))
    )
    completion_tokens = (
        _safe_int(usage.get("completion_tokens"))
        or _safe_int(usage_fallback.get("output_tokens"))
    )

    if prompt_tokens is None or completion_tokens is None:
        return None

    cache_hit_tokens = (
        _safe_int(usage.get("prompt_cache_hit_tokens"))
        or _safe_int(usage.get("cache_hit_tokens"))
        or _safe_int(prompt_details.get("cached_tokens"))
        or 0
    )
    cache_miss_tokens = (
        _safe_int(usage.get("prompt_cache_miss_tokens"))
        or _safe_int(usage.get("cache_miss_tokens"))
    )
    if cache_miss_tokens is None:
        cache_miss_tokens = max(prompt_tokens - cache_hit_tokens, 0)

    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "cache_hit_tokens": cache_hit_tokens,
        "cache_miss_tokens": cache_miss_tokens,
    }


def calculate_deepseek_cost(
    model: str | None,
    input_content: str,
    output_content: str,
    response_metadata: Mapping[str, Any] | None = None,
    usage_metadata: Mapping[str, Any] | Any | None = None,
) -> float | None:
    pricing = _get_deepseek_pricing(model)
    if pricing is None:
        logger.warning(
            "Missing DeepSeek pricing rule for model '%s'; falling back to generic token estimator.",
            model,
        )
        return None

    cache_hit_per_mtok, input_per_mtok, output_per_mtok = pricing
    usage = _extract_openai_like_usage(response_metadata=response_metadata, usage_metadata=usage_metadata)

    if usage:
        cache_hit_cost = usage["cache_hit_tokens"] * cache_hit_per_mtok / 1_000_000
        cache_miss_cost = usage["cache_miss_tokens"] * input_per_mtok / 1_000_000
        output_cost = usage["completion_tokens"] * output_per_mtok / 1_000_000
        return cache_hit_cost + cache_miss_cost + output_cost

    # Fallback estimate when the provider did not return token usage. We assume
    # all prompt tokens are cache misses.
    return _estimate_cost_from_content(
        input_content,
        output_content,
        input_cost_per_token=input_per_mtok / 1_000_000,
        output_cost_per_token=output_per_mtok / 1_000_000,
    )


def get_cost_estimation_reference(
    llm_provider: str | None,
    model: str | None,
    request_options: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    effective_provider = _resolve_effective_provider(llm_provider, model, request_options=request_options)
    if effective_provider == "deepseek":
        pricing = _get_deepseek_pricing(model)
        reference: dict[str, Any] = {
            "provider": "deepseek",
            "model": model,
            "pricing_source": DEEPSEEK_PRICING_SOURCE,
            "pricing_mode": "official",
            "currency": "USD",
        }
        if pricing is not None:
            cache_hit_per_mtok, input_per_mtok, output_per_mtok = pricing
            reference.update(
                {
                    "cache_hit_usd_per_million_tokens": cache_hit_per_mtok,
                    "input_usd_per_million_tokens": input_per_mtok,
                    "output_usd_per_million_tokens": output_per_mtok,
                }
            )
        return reference

    return {
        "provider": effective_provider or llm_provider or "unknown",
        "model": model,
        "pricing_source": "Generic OpenAI-compatible fallback estimator",
        "pricing_mode": "fallback",
        "currency": "USD",
    }


def calculate_llm_cost(
    llm_provider: str | None,
    model: str | None,
    input_content: str,
    output_content: str,
    response_metadata: Mapping[str, Any] | None = None,
    usage_metadata: Mapping[str, Any] | Any | None = None,
    request_options: Mapping[str, Any] | None = None,
) -> float:
    effective_provider = _resolve_effective_provider(llm_provider, model, request_options=request_options)

    if effective_provider == "anthropic":
        anthropic_cost = calculate_anthropic_cost(
            model=model,
            response_metadata=response_metadata,
            usage_metadata=usage_metadata,
            request_options=request_options,
        )
        if anthropic_cost is not None:
            return anthropic_cost

    if effective_provider == "deepseek":
        deepseek_cost = calculate_deepseek_cost(
            model=model,
            input_content=input_content,
            output_content=output_content,
            response_metadata=response_metadata,
            usage_metadata=usage_metadata,
        )
        if deepseek_cost is not None:
            return deepseek_cost

    return estimate_llm_cost(input_content, output_content)


def estimate_embedding_cost(model: str, docs: list) -> float:
    """Estimate the cost of embedding documents."""
    encoding = tiktoken.encoding_for_model(model)
    total_tokens = sum(len(encoding.encode(str(doc))) for doc in docs)
    return total_tokens * EMBEDDING_COST
