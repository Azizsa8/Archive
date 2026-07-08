import json
import urllib.request

mcp_url = "https://n8n-production-0304.up.railway.app/api/v1/workflows"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MGI2MmVmYy02YmE2LTRjNmQtOTIyYy1jMTc0MDliMzA1YzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjFkMzdjZDA4LTk3YjMtNGQ4ZS1hNDNkLWY1NWVjMWRiNDQwOCIsImlhdCI6MTc4MzUwNDc5NH0.a9PkU8PVER1PVhVvPfjKjptbeVNFXAdmBCYK2XH8zLQ"

with open("n8n_workflows/jana_copycat_workflow_original.json", "r") as f:
    workflow_data = json.load(f)

req = urllib.request.Request(mcp_url, data=json.dumps(workflow_data).encode('utf-8'))
req.add_header('Content-Type', 'application/json')
req.add_header('X-N8N-API-KEY', token)
req.add_header('Accept', 'application/json')

try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
