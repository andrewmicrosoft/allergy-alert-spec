# API Contracts: Queries

**Base Path**: `/api/queries`  
**Auth**: All endpoints require a valid Azure AD B2C token (verified via MSAL middleware).

---

## POST /api/queries

Submit a food query and receive AI-generated allergen guidance. The user must have at least one allergen in their profile.

**Request Body** (validated by `FoodQueryInputSchema`):

```json
{
  "queryText": "Thai food"
}
```

**Response 200**:

```json
{
  "query": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "queryText": "Thai food",
    "allergens": [
      { "id": "...", "name": "Peanuts", "severity": "allergy", "addedAt": "..." },
      { "id": "...", "name": "Shellfish", "severity": "allergy", "addedAt": "..." }
    ],
    "guidance": "Thai cuisine frequently uses peanuts in dishes like Pad Thai, satay sauces, and curries. Shellfish (shrimp, crab) is also common in stir-fries and soups like Tom Yum. Here are some safer options...",
    "disclaimer": "This information is for general guidance only and is not a substitute for professional medical advice. Always inform your server about your allergies and consult your healthcare provider for personalized dietary guidance.",
    "createdAt": "2026-03-13T14:30:00.000Z"
  }
}
```

**Response 400**: `{ "error": "Validation failed", "details": [...] }`  
**Response 401**: `{ "error": "Unauthorized" }`  
**Response 422**: `{ "error": "Please add at least one allergen to your profile before submitting a food query." }`  
**Response 503**: `{ "error": "The AI guidance service is temporarily unavailable. Please try again later." }`

---

## GET /api/queries

Retrieve the authenticated user's query history in reverse chronological order.

**Query Parameters**:

- `limit` (optional, default: 20, max: 100) — number of results per page
- `continuationToken` (optional) — Cosmos DB continuation token for pagination

**Request**: No body. User ID extracted from session token.

**Response 200**:

```json
{
  "queries": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "queryText": "Thai food",
      "guidance": "Thai cuisine frequently uses peanuts...",
      "disclaimer": "This information is for general guidance only...",
      "createdAt": "2026-03-13T14:30:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "queryText": "Olive Garden",
      "guidance": "At Olive Garden, many dishes contain...",
      "disclaimer": "This information is for general guidance only...",
      "createdAt": "2026-03-13T12:00:00.000Z"
    }
  ],
  "continuationToken": "eyJjb250aW51YXRpb24iOi4uLn0="
}
```

**Response 200** (empty history):

```json
{
  "queries": [],
  "continuationToken": null
}
```

**Response 401**: `{ "error": "Unauthorized" }`

---

## DELETE /api/queries/[id]

Delete a single query history entry. Only the owning user can delete their entries.

**URL Parameter**: `id` — UUID of the query to delete.

**Request**: No body. User ID extracted from session token; ownership verified against `userId` partition key.

**Response 200**: `{ "success": true }`  
**Response 401**: `{ "error": "Unauthorized" }`  
**Response 404**: `{ "error": "Query not found" }`
