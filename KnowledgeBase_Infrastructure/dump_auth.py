from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()
        page.goto("https://n8n-production-0304.up.railway.app/")
        page.wait_for_load_state("networkidle")
        
        print("URL:", page.url)
        print("Title:", page.title())
        
        cookies = context.cookies("https://n8n-production-0304.up.railway.app/")
        print("Cookies:", cookies)
        
        local_storage = page.evaluate("() => JSON.stringify(localStorage)")
        print("LocalStorage:", local_storage)
        
        page.close()

if __name__ == "__main__":
    run()
