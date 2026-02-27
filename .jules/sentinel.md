# Sentinel Journal

## 2024-05-22 - Initial Security Scan
**Vulnerability:** Stored XSS in Blog Post rendering
**Learning:** Content Management Systems often store rich text as HTML. Trusting this HTML blindly in `dangerouslySetInnerHTML` allows for Stored XSS if the database content is compromised or if there's an injection flaw in the editor.
**Prevention:** Always sanitize HTML content on the client-side before rendering, even if it comes from a "trusted" database. Use `dompurify`.
