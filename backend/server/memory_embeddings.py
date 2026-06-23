"""长期记忆的 embedding 生成 + 向量缓存 + 相似度计算。

复用 gpt_researcher/memory/embeddings.py 的 Memory 类（LangChain Embeddings 封装）。
所有外部调用失败都降级返回 None，让 MemoryService 回退到纯词法匹配，
保证无 API key / 无网络 / tempfile 测试环境下功能不中断。
"""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any, Iterable, List, Optional, Protocol, Tuple

import numpy as np


class _EmbedderLike(Protocol):
    """LangChain Embeddings 的最小接口契约。"""

    def embed_query(self, text: str) -> List[float]: ...

    def embed_documents(self, texts: List[str]) -> List[List[float]]: ...


class MemoryEmbeddings:
    """封装 embedding 调用与向量缓存。

    设计要点：
    - 失败即标记 ``_unavailable``，后续不再调用 embedder，保证降级路径快速。
    - 缓存原子写（``.tmp + replace``，仿 ``memory_store.py``）。
    - ``ensure_warm`` 批量回填并对重复文本去重，降低 API 成本。
    """

    def __init__(
        self,
        cache_path: Path,
        embedder: _EmbedderLike,
        model_name: str,
    ) -> None:
        self._cache_path = cache_path
        self._embedder = embedder
        self._model_name = model_name
        # cache: {memory_id: {"model": str, "vector": List[float]}}
        self._cache: dict[str, dict[str, Any]] = {}
        self._dirty = False
        self._loaded = False
        self._unavailable = False

    # ---- 缓存读写 ----------------------------------------------------------

    def _load(self) -> None:
        if self._loaded:
            return
        self._loaded = True
        if not self._cache_path.exists():
            return
        try:
            data = pickle.loads(self._cache_path.read_bytes())
            if isinstance(data, dict):
                self._cache = data
        except Exception:
            # 缓存损坏，当作空，后续会重新回填
            self._cache = {}

    def _save(self) -> None:
        if not self._dirty:
            return
        try:
            self._cache_path.parent.mkdir(parents=True, exist_ok=True)
            tmp_path = self._cache_path.with_suffix(self._cache_path.suffix + ".tmp")
            tmp_path.write_bytes(pickle.dumps(self._cache))
            tmp_path.replace(self._cache_path)
            self._dirty = False
        except Exception:
            # 持久化失败不影响本次功能；下次重算
            pass

    # ---- 对外查询接口 ------------------------------------------------------

    def get(self, memory_id: str) -> Optional[Tuple[str, List[float]]]:
        self._load()
        entry = self._cache.get(memory_id)
        if not entry:
            return None
        model = entry.get("model")
        vector = entry.get("vector")
        if not isinstance(vector, list) or not vector:
            return None
        return model, vector

    def put(self, memory_id: str, vector: List[float]) -> None:
        self._cache[memory_id] = {"model": self._model_name, "vector": vector}
        self._dirty = True

    def flush(self) -> None:
        self._save()

    @property
    def available(self) -> bool:
        return not self._unavailable

    @property
    def model_name(self) -> str:
        return self._model_name

    # ---- embedding 调用 ----------------------------------------------------

    def embed_query(self, text: str) -> Optional[List[float]]:
        if self._unavailable or not text:
            return None
        try:
            vector = self._embedder.embed_query(text)
        except Exception:
            self._unavailable = True
            return None
        if not vector:
            self._unavailable = True
            return None
        return vector

    def embed_documents(self, texts: List[str]) -> Optional[List[List[float]]]:
        if self._unavailable or not texts:
            return None
        try:
            vectors = self._embedder.embed_documents(texts)
        except Exception:
            self._unavailable = True
            return None
        if not vectors or len(vectors) != len(texts):
            self._unavailable = True
            return None
        return vectors

    # ---- 相似度 ------------------------------------------------------------

    @staticmethod
    def cosine(a: Optional[List[float]], b: Optional[List[float]]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        try:
            arr_a = np.asarray(a, dtype=np.float32)
            arr_b = np.asarray(b, dtype=np.float32)
            denom = float(np.linalg.norm(arr_a) * np.linalg.norm(arr_b))
            if denom == 0.0:
                return 0.0
            return float(np.dot(arr_a, arr_b) / denom)
        except Exception:
            return 0.0

    # ---- 冷启动批量回填 ----------------------------------------------------

    def ensure_warm(self, items: Iterable[Tuple[str, str]]) -> None:
        """批量回填缺失向量或模型不匹配的条目。

        Args:
            items: 可迭代的 ``(memory_id, text)`` 二元组。``text`` 由调用方决定
                （通常是 ``title + core_claim + summary``）。
        """
        if self._unavailable:
            return
        self._load()

        pending: List[Tuple[str, str]] = []
        for memory_id, text in items:
            if not memory_id or not text:
                continue
            entry = self._cache.get(memory_id)
            if (
                entry
                and entry.get("model") == self._model_name
                and isinstance(entry.get("vector"), list)
                and entry.get("vector")
            ):
                continue
            pending.append((memory_id, text))

        if not pending:
            return

        # 去重文本，降低 API 成本
        unique_texts: List[str] = []
        text_to_ids: dict[str, List[str]] = {}
        for memory_id, text in pending:
            ids = text_to_ids.setdefault(text, [])
            if not ids:
                unique_texts.append(text)
            ids.append(memory_id)

        vectors = self.embed_documents(unique_texts)
        if not vectors:
            return  # embed_documents 已把 _unavailable 置 True

        for text, vector in zip(unique_texts, vectors):
            for memory_id in text_to_ids[text]:
                self.put(memory_id, vector)

        self._save()
