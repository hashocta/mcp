import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { MCP_GoogleDNSServer } from "./mcp-server";
import { AuthHandler } from "./auth-handler";

export default new OAuthProvider({
  apiRoute: "/sse", // MCP clients connect to your server at this route
  apiHandler: MCP_GoogleDNSServer.mount('/sse'), // Your MCP Server implementation
  defaultHandler: AuthHandler, // Your authentication implementation
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});
