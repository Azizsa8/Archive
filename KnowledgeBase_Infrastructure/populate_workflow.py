import json
import urllib.request
import sys

mcp_url = "https://n8n-production-0304.up.railway.app/mcp-server/http"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MGI2MmVmYy02YmE2LTRjNmQtOTIyYy1jMTc0MDliMzA1YzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjFkMzdjZDA4LTk3YjMtNGQ4ZS1hNDNkLWY1NWVjMWRiNDQwOCIsImlhdCI6MTc4MzUwNDc5NH0.a9PkU8PVER1PVhVvPfjKjptbeVNFXAdmBCYK2XH8zLQ"
workflow_id = "NKZtqSLVqveudH0G"

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

with open('n8n_workflows/jana_copycat_workflow_original.json', 'r') as f:
    wf = json.load(f)

ops = []
for node in wf.get('nodes', []):
    # Remove credentials so it doesn't fail on unknown credential IDs
    if 'credentials' in node:
        del node['credentials']
    if 'webhookId' in node:
        del node['webhookId']
    ops.append({
        "type": "addNode",
        "node": node
    })

conns = wf.get('connections', {})
for source_name, conn_data in conns.items():
    for source_type, targets in conn_data.items():
        for source_index, target_list in enumerate(targets):
            for target in target_list:
                ops.append({
                    "type": "addConnection",
                    "source": source_name,
                    "target": target["node"],
                    "sourceType": source_type,
                    "sourceIndex": source_index,
                    "targetIndex": target["index"]
                })

if 'settings' in wf:
    ops.append({
        "type": "setWorkflowSettings",
        "settings": wf['settings']
    })

print(f"Applying {len(ops)} operations to workflow {workflow_id}...")

chunks = [ops[i:i + 100] for i in range(0, len(ops), 100)]
for i, chunk in enumerate(chunks):
    print(f"Sending chunk {i+1}/{len(chunks)} ({len(chunk)} ops)")
    res = call_mcp("tools/call", {
        "name": "update_workflow",
        "arguments": {
            "workflowId": workflow_id,
            "operations": chunk
        }
    })
    print("Chunk Result:", json.dumps(res, indent=2))
