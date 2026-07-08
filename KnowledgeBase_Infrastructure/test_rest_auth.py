import json
import urllib.request

url = "https://n8n-production-0304.up.railway.app/rest/workflows"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MGI2MmVmYy02YmE2LTRjNmQtOTIyYy1jMTc0MDliMzA1YzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjFkMzdjZDA4LTk3YjMtNGQ4ZS1hNDNkLWY1NWVjMWRiNDQwOCIsImlhdCI6MTc4MzUwNDc5NH0.a9PkU8PVER1PVhVvPfjKjptbeVNFXAdmBCYK2XH8zLQ"

req = urllib.request.Request(url)
req.add_header('Cookie', f'n8n-auth={token}')

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Response:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Response:", e.read().decode('utf-8'))
