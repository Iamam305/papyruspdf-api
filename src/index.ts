import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { z } from "zod";

interface Env {
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
}
import Cloudflare from "cloudflare";

const app = new OpenAPIHono<{ Bindings: Env }>();

// OpenAPI Info for root endpoint
app.openAPIRegistry.registerPath({
  method: "get",
  path: "/",
  summary: "Root endpoint",
  description: "Returns a simple greeting message",
  responses: {
    200: {
      description: "Success",
      content: {
        "text/plain": {
          schema: {
            type: "string",
            example: "Hello Hono!",
          },
        },
      },
    },
  },
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Request/Response schemas for PDF endpoint
const PDFRequestSchema = z.object({
  html: z.string().describe("HTML content to convert to PDF"),
});

const ErrorResponseSchema = z.object({
  error: z.string().describe("Error message"),
  details: z.string().optional().describe("Additional error details"),
});

// PDF endpoint route definition
const pdfRoute = createRoute({
  method: "post",
  path: "/pdf",
  summary: "Generate PDF from HTML",
  description:
    "Converts HTML content to PDF using Cloudflare Browser Rendering API. Supports Tailwind CSS classes - they will be automatically processed during PDF generation.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: PDFRequestSchema,
          example: {
            html: '<html><body><div class="bg-blue-500 text-red-500 p-8 rounded-lg"><h1 class="text-3xl font-bold">Hello World</h1><p class="mt-4">This is styled with Tailwind CSS!</p></div></body></html>',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "PDF file generated successfully",
      content: {
        "application/pdf": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
      headers: {
        "Content-Disposition": {
          schema: {
            type: "string",
            example: 'attachment; filename="generated.pdf"',
          },
          description: "PDF file attachment header",
        },
      },
    },
    400: {
      description: "Bad Request - HTML content is missing",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
  tags: ["PDF"],
});

app.openapi(pdfRoute, async (c) => {
  try {
    // Get HTML from request body
    const body = c.req.valid("json");
    const html = body.html;

    if (!html) {
      return c.json(
        { error: "HTML content is required in the request body" },
        400
      );
    }

    // Get Cloudflare account ID and API token from environment
    const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = c.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return c.json(
        {
          error:
            "Cloudflare credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.",
        },
        500
      );
    }
    const client = new Cloudflare({
      apiToken: apiToken,
      
    });
    // Call Cloudflare Browser Rendering PDF endpoint
    // Use addScriptTag to inject Tailwind CSS and pdfOptions for printBackground
    // Reference: https://developers.cloudflare.com/api/resources/browser_rendering/subresources/pdf/methods/create/
    // const response = await fetch(
    //   `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/pdf`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${apiToken}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       html: htmlWithPrintCSS,
    //       // Use addScriptTag to inject Tailwind CSS script
    //       addScriptTag: [
    //         {
    //           url: "https://cdn.tailwindcss.com",
    //         },
    //       ],
    //       // Use pdfOptions with printBackground to ensure background colors are captured
    //       pdfOptions: {
    //         printBackground: true,
    //       },
    //     }),
    //   }
    // );

    // if (!response.ok) {
    //   const errorText = await response.text();
    //   console.error("Cloudflare API error:", errorText);
    //   return c.json(
    //     {
    //       error: "Failed to generate PDF from Cloudflare API",
    //       details: errorText,
    //     },
    //     response.status as 400 | 401 | 403 | 404 | 500
    //   );
    // }
    const response = await client.browserRendering.pdf.create({
      account_id: accountId,
      html: html,
      addScriptTag:[
        {
          url: "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
          
        }
      ],
      pdfOptions:{
        printBackground: true,
        
      }
    });

    // Get PDF as array buffer
    const pdfBuffer = await response.arrayBuffer();

    // Return PDF with appropriate headers
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="generated.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return c.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Swagger UI endpoint - dynamically uses current URL
app.get("/doc", (c) => {
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const doc = app.getOpenAPIDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "TSX PDF API",
      description:
        "API for converting HTML to PDF using Cloudflare Browser Rendering",
    },
  });

  // Override servers with current URL
  return c.json({
    ...doc,
    servers: [
      {
        url: baseUrl,
        description: "Current server",
      },
    ],
  });
});

// Swagger UI
app.get("/swagger-ui", swaggerUI({ url: "/doc" }));

export default app;
