from playwright.sync_api import sync_playwright

def verify_console():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

        try:
            print("Navigating...")
            page.goto("http://localhost:3000/admin/calendar")
            page.wait_for_timeout(5000)
            page.screenshot(path="/home/jules/verification/console_debug.png")
            print("Screenshot taken.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_console()
