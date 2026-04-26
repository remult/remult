# Docs for LLMs

We support the [llms.txt](https://llmstxt.org/) convention for making documentation available to large language models and the agents that wrap them.

- [/llms.txt](/llms.txt) - curated index of every Remult doc page with a one-liner per entry, so an agent can fetch only what it needs.

## Remult Agent Skill

If you're coding with an AI agent, install the official `remult` skill so it knows our conventions (`@Entity`, `repo()`, lifecycle hooks, permissions, ValueList enums, the dual-entity pattern...):

```bash
npx skills add https://remult.dev
```

Powered by [`skills`](https://npmx.dev/package/skills) - works with Claude Code, Cursor, and any other agent it supports.
