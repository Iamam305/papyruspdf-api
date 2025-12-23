# TSX PDF API

A Cloudflare Workers API that converts HTML to PDF using Cloudflare Browser Rendering.

## Setup

```txt
npm install
```

## Configuration

Before running or deploying, you need to set up your Cloudflare credentials:

1. Get your Cloudflare Account ID from the Cloudflare dashboard
2. Create an API token with Browser Rendering permissions:
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create a token with `Account:Cloudflare Browser Rendering:Edit` permissions

### Local Development

Create a `.dev.vars` file in the root directory:

```txt
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
```

### Production Deployment

Set secrets using Wrangler:

```txt
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_API_TOKEN
```

## Development

```txt
npm run dev
```

## Deploy

```txt
npm run deploy
```

## API Documentation

### Swagger UI

Interactive API documentation is available via Swagger UI:

- **Swagger UI**: `http://localhost:8787/swagger-ui` (local development)
- **OpenAPI JSON**: `http://localhost:8787/doc` (OpenAPI specification)

After deployment, replace `localhost:8787` with your Worker's URL.

## API Usage

### POST /pdf

Converts HTML content to PDF using Cloudflare Browser Rendering.

**Request:**

- Method: `POST`
- Content-Type: `application/json`
- Body:
  ```json
  {
    "html": "<html><body><h1>Hello World</h1></body></html>"
  }
  ```

**Response:**

- Content-Type: `application/pdf`
- Body: PDF file binary data

**Example using curl:**

```bash
curl -X POST https://your-worker.workers.dev/pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<html><body><h1>Hello World</h1></body></html>"}' \
  --output generated.pdf
```

**Example using fetch (JavaScript):**

```javascript
const response = await fetch("https://your-worker.workers.dev/pdf", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    html: "<html><body><h1>Hello World</h1></body></html>",
  }),
});

const pdfBlob = await response.blob();
// Use the PDF blob as needed
```

## API Endpoints

- `GET /` - Root endpoint (returns greeting)
- `POST /pdf` - Generate PDF from HTML content
- `GET /swagger-ui` - Interactive Swagger UI documentation
- `GET /doc` - OpenAPI specification (JSON)

## References

- [Cloudflare Browser Rendering Documentation](https://developers.cloudflare.com/browser-rendering/)
- [PDF Endpoint API](https://developers.cloudflare.com/browser-rendering/rest-api/pdf-endpoint/)
- [Hono OpenAPI](https://hono.dev/api/openapi)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
