# Long-Term Memory Verification

## Automated Checks

Run these from the repo root:

```bash
cd frontend/nextjs && npx tsc --noEmit
cd ../..
python -m py_compile backend/server/app.py backend/server/memory_service.py backend/server/memory_store.py backend/server/memory_mcp_adapter.py tests/test_memory_system.py
python -m unittest tests/test_memory_system.py
```

`tests/test_memory_system.py` covers:

- corrupted `data/memory/memory.json` fallback and repair path
- sensitive-content blocking for auto memory suggestions
- selected historical conclusions round-trip into report memory references
- MCP capability surface shape

## Manual E2E Checklist

1. Open long-term memory and ensure the toggle stays on when switching between pages.
2. Complete one research report and wait for the memory reminder.
3. Click `稍后再看` and verify only the bottom-right compact entry remains.
4. Open the reminder drawer and save one suggestion.
5. Start a related research query.
6. Verify the `Research Continuity` modal appears before the new research starts.
7. Select only part of the historical conclusions and continue.
8. After the new report completes, verify `历史研究引用` only shows the selected prior conclusions.
9. Verify `本次新增发现` is shown separately from the adopted historical conclusions.

## Compatibility Checks

1. Turn long-term memory off.
2. Complete a normal research flow.
3. Verify history list, share page, and follow-up chat still work.
4. Verify no new long-term memory suggestions are saved automatically.

## Corruption Recovery Check

1. Stop the backend.
2. Replace `data/memory/memory.json` with invalid JSON.
3. Restart the backend.
4. Verify research still starts normally.
5. Open the memory page and verify it shows an empty/default state instead of crashing.
