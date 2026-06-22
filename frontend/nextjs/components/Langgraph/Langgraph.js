import { Client } from "@langchain/langgraph-sdk";
import { task } from '../../config/task';

function createLanggraphClient(langgraphHostUrl) {
  const authToken = '';

  return new Client({
    apiUrl: langgraphHostUrl,
    defaultHeaders: {
      'Content-Type': 'application/json',
      'X-Api-Key': authToken,
    },
  });
}

async function getDefaultAssistant(client) {
  const assistants = await client.assistants.search({
    metadata: null,
    offset: 0,
    limit: 10,
  });

  return assistants[0];
}

export async function startLanggraphResearch(newQuestion, report_source, langgraphHostUrl) {
  task.task.query = newQuestion;
  task.task.source = report_source;

  const client = createLanggraphClient(langgraphHostUrl);
  const agent = await getDefaultAssistant(client);
  const thread = await client.threads.create();

  return {
    streamResponse: client.runs.stream(
      thread["thread_id"],
      agent["assistant_id"],
      {
        input: task,
      },
    ),
    host: langgraphHostUrl,
    thread_id: thread["thread_id"],
    assistant_id: agent["assistant_id"],
    client,
  };
}

export function resumeLanggraphResearch({ threadId, assistantId, feedback, langgraphHostUrl }) {
  const client = createLanggraphClient(langgraphHostUrl);

  return {
    streamResponse: client.runs.stream(
      threadId,
      assistantId,
      {
        input: feedback,
      },
    ),
    client,
  };
}

export function getLanggraphThreadState({ threadId, langgraphHostUrl }) {
  const client = createLanggraphClient(langgraphHostUrl);
  return client.threads.getState(threadId);
}
