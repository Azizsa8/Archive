import json
import urllib.request
import sys

mcp_url = "https://n8n-production-0304.up.railway.app/mcp-server/http"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MGI2MmVmYy02YmE2LTRjNmQtOTIyYy1jMTc0MDliMzA1YzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjFkMzdjZDA4LTk3YjMtNGQ4ZS1hNDNkLWY1NWVjMWRiNDQwOCIsImlhdCI6MTc4MzUwNDc5NH0.a9PkU8PVER1PVhVvPfjKjptbeVNFXAdmBCYK2XH8zLQ"

def call_mcp(method, params):
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "id": 1,
        "params": params
    }
    req = urllib.request.Request(mcp_url, data=json.dumps(payload).encode('utf-8'))
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json, text/event-stream')
    req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as response:
            raw_data = response.read().decode('utf-8')
            for line in raw_data.splitlines():
                if line.startswith('data:'):
                    return json.loads(line[5:].strip())
    except Exception as e:
        print("MCP Error:", e)
        if hasattr(e, 'read'):
            print(e.read().decode('utf-8'))
        sys.exit(1)

# 1. Create an empty workflow
code = """
import { workflow } from '@n8n/workflow-sdk';
export default workflow('Jana_Copycat_Temp', 'Jana_Copycat_Temp');
"""
res = call_mcp("tools/call", {
    "name": "create_workflow_from_code",
    "arguments": {
        "code": code
    }
})
print("Create Result:", json.dumps(res, indent=2))
