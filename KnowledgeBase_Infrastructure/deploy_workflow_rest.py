import json
import urllib.request
import sys

mcp_url = "https://n8n-production-0304.up.railway.app/api/v1/workflows"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MGI2MmVmYy02YmE2LTRjNmQtOTIyYy1jMTc0MDliMzA1YzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjFkMzdjZDA4LTk3YjMtNGQ4ZS1hNDNkLWY1NWVjMWRiNDQwOCIsImlhdCI6MTc4MzUwNDc5NH0.a9PkU8PVER1PVhVvPfjKjptbeVNFXAdmBCYK2XH8zLQ"

file_path = r"C:\Users\AISAR\OneDrive\Desktop\ARCHIVE\KnowledgeBase_Infrastructure\n8n_workflows\jana_copycat_workflow_original.json"

with open(file_path, "r", encoding="utf-8") as f:
    workflow_json = f.read()
    
# Remove meta and id if they cause conflicts
try:
    data = json.loads(workflow_json)
    if "meta" in data:
        del data["meta"]
    if "id" in data:
        del data["id"]
    workflow_json = json.dumps(data)
except Exception as e:
    pass

req = urllib.request.Request(mcp_url, data=workflow_json.encode('utf-8'))
req.add_header('Content-Type', 'application/json')
req.add_header('X-N8N-API-KEY', token)
req.add_header('Authorization', f'Bearer {token}')

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Response:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Response:", e.read().decode('utf-8'))
