# API Contracts: Allergens

**Base Path**: `/api/allergens`  
**Auth**: All endpoints require a valid Azure AD B2C token (verified via MSAL middleware).

---

## GET /api/allergens

Retrieve the authenticated user's allergen list.

**Request**: No body. User ID extracted from session token.

**Response 200**:

```json
{
  "allergens": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Peanuts",
      "severity": "allergy",
      "addedAt": "2026-03-13T10:00:00.000Z"
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "name": "Lactose",
      "severity": "intolerance",
      "addedAt": "2026-03-13T10:05:00.000Z"
    }
  ]
}
```

**Response 401**: `{ "error": "Unauthorized" }`

---

## POST /api/allergens

Add a new allergen to the authenticated user's profile.

**Request Body** (validated by `AllergenInputSchema`):

```json
{
  "name": "Shellfish",
  "severity": "allergy"
}
```

**Response 201**:

```json
{
  "allergen": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Shellfish",
    "severity": "allergy",
    "addedAt": "2026-03-13T12:00:00.000Z"
  }
}
```

**Response 400**: `{ "error": "Validation failed", "details": [...] }`  
**Response 401**: `{ "error": "Unauthorized" }`  
**Response 409**: `{ "error": "Allergen 'Shellfish' already exists in your profile" }`

---

## PUT /api/allergens

Update an existing allergen in the authenticated user's profile.

**Request Body** (validated by `AllergenUpdateSchema`):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Peanuts",
  "severity": "intolerance"
}
```

**Response 200**:

```json
{
  "allergen": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Peanuts",
    "severity": "intolerance",
    "addedAt": "2026-03-13T10:00:00.000Z"
  }
}
```

**Response 400**: `{ "error": "Validation failed", "details": [...] }`  
**Response 401**: `{ "error": "Unauthorized" }`  
**Response 404**: `{ "error": "Allergen not found" }`  
**Response 409**: `{ "error": "Allergen 'Peanuts' already exists in your profile" }` (if renaming to a duplicate)

---

## DELETE /api/allergens

Delete an allergen from the authenticated user's profile.

**Request Body**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 200**: `{ "success": true }`  
**Response 401**: `{ "error": "Unauthorized" }`  
**Response 404**: `{ "error": "Allergen not found" }`
