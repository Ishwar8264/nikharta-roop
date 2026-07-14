/**
 * ========================================================
 * SWAGGER UI HTML ROUTE (ULTIMATE PREMIUM VERSION)
 * Uses stable jsDelivr CDN, Google Font 'Inter',
 * soft shadows, modern colors, and smooth button animations.
 * ========================================================
 */

import { NextResponse } from "next/server";

export async function GET() {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nikharta Roop Salon API</title>
    
    <!-- Google Font: Inter for premium typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
    
    <!-- Stable CDN CSS for Classic Swagger UI -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css" />
    
    <style>
      /* ============================================== */
      /* GLOBAL TYPOGRAPHY & STYLING OVERRIDES          */
      /* ============================================== */
      
      html, body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: #f8fafc !important; /* Slate-50 background for a soft look */
      }

      /* Typography - Bold & Modern */
      .swagger-ui .info .title {
        font-weight: 800 !important;
        letter-spacing: -0.5px !important;
        color: #0f172a !important;
        font-size: 34px !important;
      }
      .swagger-ui .opblock-tag {
        font-weight: 600 !important;
        font-size: 18px !important;
        padding: 12px 0 !important;
        border-bottom: 2px solid transparent !important;
        transition: all 0.3s ease !important;
      }
      .swagger-ui .opblock-tag:hover {
        border-bottom: 2px solid #10b981 !important; /* Green underline on hover */
        background: #f1f5f9 !important;
        border-radius: 6px 6px 0 0 !important;
      }
      .swagger-ui .opblock-summary-method {
        font-weight: 700 !important;
        border-radius: 6px !important;
        padding: 4px 12px !important;
      }

      /* ============================================== */
      /* TOP BAR & HEADER (SLATE BLUE & GREEN BORDER)   */
      /* ============================================== */
      
      .swagger-ui .topbar {
        background: #0f172a !important; /* Deep Slate Blue */
        border-bottom: 4px solid #10b981 !important; /* Emerald Green border */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }
      .swagger-ui .topbar .link {
        color: #ffffff !important;
        font-weight: 600 !important;
        letter-spacing: 0.5px !important;
      }
      
      /* ============================================== */
      /* MODERN INPUT FIELDS & FORMS                    */
      /* ============================================== */

      .swagger-ui input[type="text"], 
      .swagger-ui textarea, 
      .swagger-ui select {
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        padding: 8px 12px !important;
        background-color: #ffffff !important;
        color: #1e293b !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
      }
      .swagger-ui input[type="text"]:focus, 
      .swagger-ui textarea:focus {
        border-color: #10b981 !important;
        outline: none !important;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important; /* Soft green glow */
      }

      /* ============================================== */
      /* BUTTONS & ANIMATIONS (COOL & DESCENT)          */
      /* ============================================== */

      .swagger-ui .btn {
        border-radius: 8px !important;
        font-weight: 600 !important;
        padding: 10px 20px !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .swagger-ui .btn:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
      }

      /* Green Authorize Button */
      .swagger-ui .btn.authorize {
        background-color: #10b981 !important;
        border-color: #10b981 !important;
        color: white !important;
        box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4) !important;
      }
      .swagger-ui .btn.authorize svg { fill: white !important; }
      .swagger-ui .btn.authorize:hover {
        background-color: #059669 !important;
        box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.5) !important;
      }

      /* Clean Gray Cancel / Close Button (Fixes your red outline screenshot) */
      .swagger-ui .btn.cancel {
        background-color: #f1f5f9 !important; 
        border: 1px solid #cbd5e1 !important;
        color: #475569 !important;
        box-shadow: none !important;
      }
      .swagger-ui .btn.cancel:hover {
        background-color: #e2e8f0 !important;
        border-color: #94a3b8 !important;
        color: #0f172a !important;
        transform: translateY(-2px) !important;
      }

      /* Blue Execute Button */
      .swagger-ui .btn.execute {
        background-color: #3b82f6 !important;
        border-color: #3b82f6 !important;
        color: white !important;
        box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4) !important;
      }
      .swagger-ui .btn.execute:hover {
        background-color: #2563eb !important;
        box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5) !important;
      }

      /* ============================================== */
      /* RESPONSE CODES & POPUP MODAL                   */
      /* ============================================== */

      /* Rounded vibrant status codes (200, 400, 500) */
      .swagger-ui .opblock .opblock-summary .opblock-summary-get .opblock-summary-method {
        background: #3b82f6 !important;
      }
      .swagger-ui .opblock .opblock-summary .opblock-summary-post .opblock-summary-method {
        background: #10b981 !important;
      }
      .swagger-ui .opblock .opblock-summary .opblock-summary-put .opblock-summary-method {
        background: #f59e0b !important;
      }
      .swagger-ui .opblock .opblock-summary .opblock-summary-delete .opblock-summary-method {
        background: #ef4444 !important;
      }

      /* Modal (Authorize Popup) - Clean slate */
      .swagger-ui .dialog-ux .modal-ux {
        border-radius: 16px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        border: none !important;
        background: white !important;
      }
      .swagger-ui .dialog-ux .modal-ux-content {
        padding: 20px 30px !important;
      }
      .swagger-ui .dialog-ux .modal-ux-header h3 {
        font-weight: 700 !important;
        color: #0f172a !important;
      }

      /* Response Body Code Styling */
      .swagger-ui .opblock-body pre {
        background: #0f172a !important;
        color: #e2e8f0 !important;
        border-radius: 8px !important;
        padding: 16px !important;
        font-family: 'Fira Code', monospace !important;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    
    <!-- Stable jsDelivr CDN JS Bundle & Preset -->
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
    
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          url: "/api/v1/docs", 
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "BaseLayout"
        });
      };
    </script>
  </body>
  </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
