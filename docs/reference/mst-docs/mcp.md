> For the complete documentation index, see [llms.txt](https://docs.mstblockchain.com/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.mstblockchain.com/developer-docs/foundation/mcp.md).

# MCP

The MST Blockchain MCP (Model Context Protocol) Server is an intelligent documentation gateway that allows AI assistants — including Claude — to access, search, and surface the complete MST blockchain

### 1. What is MCP?

Model Context Protocol (MCP) is an open standard introduced by Anthropic that enables AI models to connect securely to external data sources and tools. It defines a standard interface between an AI assistant and external "MCP Servers" that expose resources, tools, and prompts.

### 2. The **mst-mcp** Server

The mst-mcp server acts as the official documentation interface for MST Blockchain. It is deployed at: <https://mcp.mstblockchain.com/sse>

### 3. Connecting mst-mcp in Claude.ai

Users can connect the mst-mcp server directly in the Claude.ai interface using the MCP connectors panel:

1\.   Open Claude.ai in your browser

2\.   Navigate to Settings → Connectors (or MCP Apps)

3\.   Click "Add MCP Server" or "Connect New MCP"

4\.   Enter the server URL: **<https://mcp.mstblockchain.com/sse>**

5\.   Set the server name to "mst-mcp"

6\.    Authentication:

**`OAUTH_CLIENT_ID=mst-mcp-client`**

**`OAUTH_CLIENT_SECRET=mst-mcp-secret-key-350e3445`**

7\.   Save and activate — the three tools are now available in chat

{% hint style="info" %}
&#x20; **Tip:** Once connected, Claude will automatically call mst-mcp tools when you ask MST blockchain questions — no special commands needed.
{% endhint %}

### 4. Support & Resources

<table data-header-hidden><thead><tr><th valign="top"></th><th valign="top"></th></tr></thead><tbody><tr><td valign="top">Resource</td><td valign="top">Link</td></tr><tr><td valign="top">MST Blockchain Website</td><td valign="top">https://mstblockchain.com</td></tr><tr><td valign="top">MCP Server Endpoint</td><td valign="top">https://mcp.mstblockchain.com/sse</td></tr><tr><td valign="top">Claude.ai MCP Docs</td><td valign="top">https://claude.ai/docs/claude-tag/overview</td></tr><tr><td valign="top">Anthropic MCP Guide</td><td valign="top">https://docs.anthropic.com</td></tr></tbody></table>
