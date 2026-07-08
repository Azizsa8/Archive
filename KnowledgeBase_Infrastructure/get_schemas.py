import json
import urllib.request

mcp_url = "https://n8n-production-0304.up.railway.app/mcp-server/http"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MGI2MmVmYy02YmE2LTRjNmQtOTIyYy1jMTc0MDliMzA1YzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjFkMzdjZDA4LTk3YjMtNGQ4ZS1hNDNkLWY1NWVjMWRiNDQwOCIsImlhdCI6MTc4MzUwNDc5NH0.a9PkU8PVER1PVhVvPfjKjptbeVNFXAdmBCYK2XH8zLQ"

payload = {
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
}

req = urllib.request.Request(mcp_url, data=json.dumps(payload).encode('utf-8'))
req.add_header('Content-Type', 'application/json')
req.add_header('Accept', 'application/json, text/event-stream')
req.add_header('Authorization', f'Bearer {token}')

with urllib.request.urlopen(req) as response:
    raw_data = response.read().decode('utf-8')
    for line in raw_data.splitlines():
        if line.startswith('data:'):
            json_data = line[5:].strip()
            res = json.loads(json_data)
            tools = res.get('result', {}).get('tools', [])
            for t in tools:
                if t['name'] in ['update_workflow', 'create_workflow_from_code']:
                    print(t['name'])
                    print(json.dumps(t.get('inputSchema'), indent=2))
