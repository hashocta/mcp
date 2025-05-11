import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type Props = {
  accessToken?: string;
  userId: string;
};

type Env = {
  GOOGLE_DNS_API_KEY?: string;
};

type State = {
  dnsQueries: Array<{
    domain: string;
    type: string;
    result: any;
    timestamp: number;
  }>;
};

export class MCP_GoogleDNSServer extends McpAgent<Props, Env, State> {
  server = new McpServer({
    name: "Google DNS MCP Server",
    version: "1.0.0",
    description: "An MCP server that provides Google Public DNS lookup capabilities",
  });

  initialState: State = {
    dnsQueries: [],
  };

  async init() {
    // Add DNS lookup tool
    this.server.tool(
      "dnsLookup",
      "Look up DNS records using Google Public DNS",
      {
        domain: z.string().describe("The domain to lookup (e.g., example.com)"),
        type: z.enum(["A", "AAAA", "CNAME", "MX", "NS", "SOA", "TXT"]).describe("DNS record type to lookup"),
      },
      async ({ domain, type }) => {
        try {
          const result = await this.performDnsLookup(domain, type);
          
          // Store the query in state
          this.setState({
            ...this.state,
            dnsQueries: [
              ...this.state.dnsQueries,
              {
                domain,
                type,
                result,
                timestamp: Date.now(),
              },
            ],
          });
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(result, null, 2) 
            }],
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error performing DNS lookup: ${error.message}` 
            }],
          };
        }
      }
    );

    // Add tool to view query history
    this.server.tool(
      "getDNSHistory",
      "Get history of DNS queries made in this session",
      {},
      async () => {
        if (this.state.dnsQueries.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: "No DNS queries have been performed in this session yet." 
            }],
          };
        }
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(this.state.dnsQueries, null, 2) 
          }],
        };
      }
    );
  }

  // Helper method to perform actual DNS lookup using Google Public DNS API
  async performDnsLookup(domain: string, recordType: string) {
    // Google Public DNS API endpoint
    // Note: This is a simplified version. In a real implementation, you might 
    // need to use the DNS-over-HTTPS protocol instead
    const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${recordType}`;
    
    const headers: HeadersInit = {};
    if (this.env.GOOGLE_DNS_API_KEY) {
      headers['Authorization'] = `Bearer ${this.env.GOOGLE_DNS_API_KEY}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`DNS lookup failed with status: ${response.status}`);
    }
    
    return await response.json();
  }

  onStateUpdate(state: State) {
    console.log({ stateUpdate: state });
  }
}
