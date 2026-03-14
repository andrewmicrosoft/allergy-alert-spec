# Feature Specification: Allergy Alert MVP

**Feature Branch**: `001-allergy-alert-mvp`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "I want to build a webapp called 'Allergy Alert'. People with food allergies will be able to go to this website, login, and input any foods they are intolerant or allergic to. Once they have built their profile, they will enter in a restaurant or type of food that they want to eat, and our webapp will call an AI Agent API through Azure AI Foundry and run a prompt asking how best to avoid their allergens given the food or type of food they want to eat."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Account and Allergy Profile (Priority: P1)

A new user visits Allergy Alert, creates an account, and builds their allergy profile. They add each food they are allergic or intolerant to and can distinguish between a true allergy (potentially life-threatening) and an intolerance (causes discomfort). They can update or remove items from their profile at any time.

**Why this priority**: Without a stored allergy profile the AI guidance feature has no data to work with. This is the foundation of the entire application.

**Independent Test**: A user can sign up, log in, add several allergens to their profile, log out, log back in, and see the same allergens persisted.

**Acceptance Scenarios**:

1. **Given** a visitor with no account, **When** they complete the registration form with valid credentials, **Then** an account is created and they are logged in.
2. **Given** a logged-in user with an empty profile, **When** they add "Peanuts" as an allergy and "Lactose" as an intolerance, **Then** both items appear in their profile with the correct severity labels.
3. **Given** a logged-in user with existing allergens, **When** they remove "Lactose" from their profile, **Then** "Lactose" no longer appears and "Peanuts" remains.
4. **Given** a logged-in user, **When** they log out and log back in, **Then** their previously saved allergens are still present.

---

### User Story 2 - Get AI-Powered Allergen Guidance (Priority: P2)

A logged-in user with at least one allergen in their profile enters a restaurant name or a type of food (e.g., "Thai food", "Olive Garden") and submits a query. The system sends the user's allergen list and food query to an AI agent via Azure AI Foundry and displays personalized guidance on what to avoid, what is generally safe, and any precautions to take.

**Why this priority**: This is the core value proposition — translating the allergy profile into actionable dining advice. It depends on the profile from US1.

**Independent Test**: A user with allergens saved can submit a food query and receive a coherent, allergen-aware response displayed on screen.

**Acceptance Scenarios**:

1. **Given** a user with "Peanuts" and "Shellfish" in their profile, **When** they search for "Thai food", **Then** the system returns guidance that mentions peanut-containing dishes to avoid, shellfish-containing dishes to avoid, and safer alternatives.
2. **Given** a user with allergens in their profile, **When** they search for a specific restaurant name, **Then** the guidance is contextualised to that restaurant's typical menu style.
3. **Given** a user with no allergens in their profile, **When** they attempt to submit a food query, **Then** the system prompts them to add at least one allergen first.
4. **Given** a user submits a query, **When** the AI service is temporarily unavailable, **Then** the system displays a clear error message and does not crash.

---

### User Story 3 - View Query History (Priority: P3)

A logged-in user can view a list of their past food queries and the AI guidance they received, so they can reference previous advice without re-querying.

**Why this priority**: Adds convenience and repeat-visit value but is not required for the core allergy-check workflow.

**Independent Test**: A user submits two different food queries, navigates to their history, and sees both queries with their responses listed in reverse chronological order.

**Acceptance Scenarios**:

1. **Given** a user who has previously queried "Italian food", **When** they open their query history, **Then** they see the query, the date it was made, and the AI response.
2. **Given** a user with no prior queries, **When** they open their query history, **Then** they see an empty state message indicating no past queries.

---

### Edge Cases

- What happens when a user enters a food query that is nonsensical or not food-related? The AI response should gracefully indicate it cannot provide allergen guidance for that input.
- What happens when the user's session expires mid-query? The system should redirect to login and preserve the query so it can be resubmitted after re-authentication.
- What happens when a user adds a duplicate allergen? The system should prevent duplicates and inform the user the item already exists.
- What happens when the AI response contains a disclaimer about medical advice? Every AI response must include a standard disclaimer that this is informational only and not a substitute for medical advice.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to register and sign in via Azure AD B2C (email/password flow managed by the identity provider).
- **FR-002**: System MUST allow users to log out, ending the Azure AD B2C session.
- **FR-003**: System MUST allow authenticated users to add allergens to their profile, specifying a label (allergy vs. intolerance).
- **FR-004**: System MUST allow authenticated users to edit or remove allergens from their profile.
- **FR-005**: System MUST persist each user's allergen profile across sessions in Azure Cosmos DB.
- **FR-006**: System MUST allow authenticated users to submit a free-text food query (restaurant name or food type).
- **FR-007**: System MUST send the user's allergen list and food query to an AI agent via Azure AI Foundry and display the returned guidance.
- **FR-008**: System MUST block food queries when the user's allergen profile is empty, prompting them to add allergens first.
- **FR-009**: System MUST append a medical-advice disclaimer to every AI-generated response.
- **FR-010**: System MUST store each query and its AI response in the user's history.
- **FR-011**: System MUST allow authenticated users to view their query history in reverse chronological order.
- **FR-012**: System MUST display a user-friendly error message when the AI service is unavailable.
- **FR-013**: System MUST allow authenticated users to delete individual entries from their query history.

### Key Entities

- **User** (`UserDocument`): A registered person. Identified by Azure AD B2C object ID. Has email and a collection of embedded allergens. Stored in the `users` Cosmos DB container.
- **Allergen**: A food item a user cannot or should not eat. Has a name and a severity (allergy or intolerance). Embedded in the User document (not a separate container).
- **QueryDocument**: A user-submitted food query and its AI-generated guidance, stored as a single document. Has the query text, a snapshot of the user's allergens at query time, the AI guidance response text, a medical disclaimer, a timestamp, and a reference to the user. Stored in the `queries` Cosmos DB container. _(Combines the conceptual FoodQuery and GuidanceResponse into one document for storage efficiency.)_

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can register, build an allergy profile, and receive AI guidance in under 5 minutes on their first visit.
- **SC-002**: 90% of AI guidance responses are returned and displayed within 10 seconds of query submission.
- **SC-003**: Users can retrieve any past query and its response from their history within 2 clicks from the main screen.
- **SC-004**: System handles 500 concurrent users without degradation in response time.
- **SC-005**: 95% of users who complete their allergy profile successfully submit at least one food query.

## Clarifications

### Session 2026-03-13

- Q: How should user authentication be implemented? → A: Azure AD B2C (managed identity platform, integrates natively with Azure ecosystem).
- Q: What database/storage technology should be used for persisting user profiles, allergens, and query history? → A: Azure Cosmos DB (NoSQL document store, native Azure integration, elastic scale).
- Q: What should happen when the Azure AI Foundry service call fails — automatic retry or manual resubmission? → A: No retry; just display error message (deferred to post-MVP).
- Q: What web application framework/stack should be used for the front-end? → A: Next.js with TypeScript (React-based with server-side rendering).
- Q: Should query history entries be deletable by the user, or is the history append-only? → A: Users can delete individual history entries from their query history.

## Assumptions

- Users have a modern web browser with JavaScript enabled.
- The front-end is built with Next.js (App Router) and TypeScript with React; Tailwind CSS is used for styling. Azure AD B2C integration uses MSAL.js (via @azure/msal-react or Next.js middleware). Next.js API routes (Route Handlers) serve as the backend layer for all server-side operations including Cosmos DB access and Azure AI Foundry calls. All Next.js security features (CSRF protection, Content-Security-Policy headers, server-only modules, input sanitization) MUST be utilized.
- Azure AI Foundry provides a stable API endpoint for the AI agent; the project will authenticate using a user-provided API key stored in environment variables and call the endpoint via REST or the Azure AI Foundry SDK from Next.js Route Handlers (server-side only).
- Authentication is handled by Azure AD B2C; the application delegates sign-up, sign-in, and password reset flows to Azure AD B2C rather than managing credentials directly.
- Data persistence uses Azure Cosmos DB (NoSQL); user profiles, allergen lists, food queries, and guidance responses are stored as JSON documents.
- The AI agent is pre-configured in Azure AI Foundry; this project integrates with it but does not train or fine-tune models.
- No offline support is required for MVP.
