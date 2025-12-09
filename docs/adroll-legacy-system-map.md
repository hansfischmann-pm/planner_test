# Legacy System Map: AdRoll Sandbox

## 1. Top-Level Navigation (Verified)
The following navigation structure was confirmed in the sandbox environment (`app.adroll.com`):

*   **Home**
    *   *Description:* The centralized command center providing a high-level overview of account performance, active campaigns, and website traffic health.
    *   *Function:* Aggregates data from multiple sources to provide a "morning coffee" view for marketers.
*   **Campaigns**
    *   *Description:* The primary workspace for managing advertising initiatives. Lists all active, paused, and archived campaigns.
    *   *Function:* Allows users to create, edit, pause, and monitor the delivery of specific ad strategies (e.g., Retargeting vs. Awareness).
*   **Audiences**
    *   *Description:* The segmentation engine that defines *who* sees the ads.
    *   *Function:* Categorizes website visitors or CRM contacts into targetable groups based on behavior (pages visited) or identity (email lists).
*   **Creatives**
    *   *Description:* The asset management library for all visual ad content.
    *   *Function:* Stores, validates, and organizes the actual banner ads, videos, and native assets used in campaigns.
*   **Analytics**
    *   *Description:* The data reporting suite for deep-dive performance analysis.
    *   *Function:* Provides granular feedback on what is working, enabling data-driven optimization decisions.
*   **AI Assistant**
    *   *Description:* An embedded utility offering proactive suggestions.
    *   *Function:* Analyzes account data to surface "easy wins" or alerts (e.g., "Budget unspent").
*   **Integrations**
    *   *Description:* The connection hub for third-party platforms.
    *   *Function:* Syncs data between AdRoll and external systems like Shopify (ecommerce data) or HubSpot (CRM data).
*   **Settings**
    *   *Description:* Administrative control panel.
    *   *Function:* Manages billing, user access, and tracking pixel configuration.

## 2. Dashboard Components (Verified)
The main "Home" dashboard contains the following widgets:

*   **Date Range Selector:** Global date filter (e.g., "Last 7 Days") that updates all dashboard widgets simultaneously.
*   **Website Metrics Cards:**
    *   **New Visitors:** Measures top-of-funnel growth (NET NEW pixel fires).
    *   **Return Visitors:** Measures retention and retargeting potential (Repeat pixel fires).
    *   **Add-to-Cart:** Tracks high-intent actions, signaling conversion potential.
    *   **Total Conversions:** The ultimate success metric (Purchases/Leads).
*   **Ad Campaign Performance Summary:**
    *   **Chart:** Visualizes the correlation between Spend and Results (e.g., Spend vs. ROAS) over time.
    *   **Campaign Table:** A quick-access list of top campaigns, allowing for rapid status toggling without leaving the home screen.
*   **AI Assistant Panel:** Highlights action items like "Creative Fatigue" warnings or "Audience Growth" opportunities.

## 3. System Interconnectivity & Context
How these components work together to drive the advertising engine:

### The Core Loop: Pixel -> Audience -> Creative -> Campaign -> Analytics
1.  **Data Ingestion (The Pixel):** The "AdRoll Pixel" (configured in Settings) sits on the user's website, firing events for every page view and action (Add to Cart, Purchase).
2.  **Segmentation (Audiences):** The **Audiences** module consumes this Pixel data. For example, it places users who visited `/checkout` but didn't trigger `purchase` into a "Cart Abandoners" segment.
3.  **Asset Preparation (Creatives):** The marketer uploads visual assets to the **Ad Library**. These are totally separate from campaigns until assigned.
4.  **Execution (Campaigns):** The **Campaign** is the engine that combines *Who* (Audience) with *What* (Creative). You attach the "Cart Abandoners" audience and the "Come Back" creative to a Retargeting Campaign.
5.  **Optimization (Analytics):** As the campaign runs, it generates data (Impressions, Clicks). This feeds back into **Analytics**, which tells the marketer if the "Come Back" creative is effective.
6.  **Automation (AI Assistant):** The AI watches this entire loop. If the "Cart Abandoners" audience becomes too small, it alerts the user on the **Home** dashboard.

## 4. Key Workflows (Detail)

### Campaign Creation
*   **Entry:** `Campaigns > Create`
*   **Context:** This is the assembly phase where strategy becomes execution.
*   **Types:**
    *   **Ad Campaign:** Manual control for experienced traders.
    *   **Recipes:** "Wizard-style" setup for specific business goals (e.g., "Recover Abandoned Carts").
*   **Typical Steps:**
    1.  **Objective:** Defines the optimization algo (e.g., maximize clicks vs. maximize ROAS).
    2.  **Audience Selection:** Pulls from the **Audiences** module.
    3.  **Ad Selection:** Pulls from the **Creatives** library.
    4.  **Budgeting:** Sets the financial constraints.

### Audience Creation
*   **Entry:** `Audiences > Website Audiences > New Audience`.
*   **Context:** Defines the pooling logic for future targeting.
*   **Types:**
    *   **URL Visited:** Logic: *If URL contains 'product-page'*.
    *   **Page Duration:** Logic: *If time-on-site > 60s*.
    *   **Event-Based:** Logic: *If pixel event = 'signup'*.
    *   **Connected Audience:** Logic: *Match email in CSV to browser cookie*.

### Reporting & Analytics
*   **Context:** Closes the feedback loop to inform future budget allocation.
*   **Report Types:**
    *   **Campaign Performance:** "Which campaign made money?"
    *   **Attribution Path:** "Did they click a Facebook ad before clicking this display ad?"

## 5. API & Developer Resources
Based on `developers.nextroll.com` and `apidocs.nextroll.com`:

### Developer Portal
- **Registration**: `developers.nextroll.com` - create separate apps for prod/test
- **Each app receives**: Consumer key + secret for OAuth

### Base URL & Authentication
- **Base URL**: `https://services.adroll.com`
- **Protocol**: HTTPS only
- **Default Quota**: 100 API requests per service daily (increases available on request)

**Authentication Options:**
1. **OAuth 2.0** - Primary method for production integrations
2. **Personal Access Token (PAT)** - Simpler alternative
   - Header: `Authorization: Token YOUR_TOKEN`
   - Query param: `?apikey=YOUR_CLIENT_ID`

**First API Call** (Get Advertisable EID - required for most calls):
```bash
curl -H 'Authorization: Token YOUR_TOKEN' \
  'https://services.adroll.com/api/v1/organization/get_advertisables?apikey=MYAPIKEY'
```

### Core APIs (10 Total)

#### 1. CRUD API (`/api/v1/`)
Campaign, ad, and pixel management via REST.

**Key Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/ad/create` | POST | Create ad with creative file (base64/multipart) |
| `/api/v1/ad/clone` | POST | Duplicate existing ad |
| `/api/v1/campaign/create` | POST | Create campaign with budget, dates, networks |
| `/api/v1/campaign/pause` | PUT | Pause/unpause campaign |
| `/api/v1/adgroup/create` | POST | Create adgroup within campaign |
| `/api/v1/adgroup/add_segments` | POST | Associate audience segments |
| `/api/v1/advertisable/get_segments` | GET | List pixel-based segments |
| `/api/v1/product_feeds/autoconfigure` | POST | Auto-configure feed parsing |
| `/api/v1/organization/get_advertisables` | GET | List all advertisables |
| `/api/v1/report/ad` | GET | Performance metrics |

#### 2. GraphQL Reporting API (`/reporting/`)
Custom reporting for BI tools (Tableau, Domo, Looker).
- Query builder: `app.adroll.com/reporting/graphiql`
- No max query size (parallel processing)
- Data freshness: ~12hrs preliminary, 48hrs final

**Schema Objects:**
- `Advertisable` → `Campaign` → `Adgroup` → `Ad`
- `Audience`, `Automation`, `Email`, `SMSMessage`

**Metrics Breakdowns:**
- `byDate`, `byDomain`, `byCountry`, `byPlacement`
- `conversions`, `granularConversions`

**Attribution Models:**
- `firsttouch`, `lastclick`, `linear`, `positional`, `timedecay`

#### 3. Audience API (`/audience/`)
Segment and target account management.
- Segment types and classification
- Target Account Lists (TAL) - list/add/remove
- User records for CRM integration

#### 4. User Lists API (`/user-lists/`)
Audience size queries and segment operations.
- Retrieve segment sizes
- CDP operations

#### 5. Prospecting API (`/prospecting/api/v2/`)
New audience acquisition campaigns.

**Workflow:**
1. `POST /advertisables/(adv)/campaigns` - Create campaign with weekly budget
2. `POST /campaigns/(campaign)/adgroups` - Add adgroups with `auto_audience: true`
3. `POST /adgroups/(adgroup)/audience` - Optional custom audience
4. `POST /adgroups/(adgroup)/flights` - Optional time windows

**Note:** Must set `auto_geo_targets: false` and specify explicit geo targets.

#### 6. Automated Campaigns API (`/activate/`)
Wizard-style "Recipes" for business goals.

#### 7. Universal Campaigns API (`/activate/`)
Cross-channel campaign management.

#### 8. Geotargeting API (`/geo/`)
Location-based targeting EID search.

#### 9. Site Traffic Revealer (JavaScript)
B2B visitor firmographic data.
- Get visitor attributes
- Data dictionary of available fields

#### 10. Server-to-Server (S2S) API
Server-side event tracking (under active development).

**User Identifiers:**
- Click ID (`adct`)
- First-party cookies
- Mobile device IDs
- Email addresses
- Custom user IDs

**B2C Events:** Page views, product search, add-to-cart, purchase
**B2B/ABM Events:** High-value page visits, demo requests, trial signups, form submissions

### OAuth 2.0 Authentication

**Endpoints:**
- Authorization: `https://services.adroll.com/auth/authorize`
- Token: `https://services.adroll.com/auth/token`

**Grant Types:** Authorization Code, Implicit, Resource Owner Password

**Scope:** `all` (single scope, grants full access)

**Token Lifecycle:**
- Access tokens: 24 hours
- Refresh tokens: 1 year

**Token Usage:**
- Header: `Authorization: Bearer {ACCESS_TOKEN}`
- Form: `access_token={ACCESS_TOKEN}`
- Query: `?access_token={ACCESS_TOKEN}`

### FAQ Notes
- **Data freshness:** Real-time approximate, 48hrs for final
- **Ad deletion:** Soft delete (`is_active: false`), not permanent
- **GraphQL limits:** No max query size

### Data Models
Below is the inferred schema based on API docs + UI fields:

#### `Campaign`
*   `id`: String (UUID)
*   `name`: String (Required)
*   `status`: Enum (`ACTIVE`, `PAUSED`, `DRAFT`, `ARCHIVED`)
*   `objective`: Enum (`CONVERSIONS`, `AWARENESS`, `RETARGETING`)
*   `budget_daily`: Money
*   `start_date`: ISO8601 Date
*   `end_date`: ISO8601 Date (Optional)
*   `attribution_model`: Enum (`LAST_TOUCH`, `FIRST_TOUCH`, `LINEAR`)

#### `AdGroup` (Child of Campaign)
*   `id`: String
*   `campaign_id`: String
*   `type`: Enum (`WEB`, `SOCIAL`, `EMAIL`)
*   `audiences`: Array<AudienceID>
*   `placements`: Array<String> (e.g., "facebook", "web_inventory")

#### `Creative`
*   `id`: String
*   `name`: String
*   `file_url`: String (CDN)
*   `format`: Enum (`IMAGE`, `VIDEO`, `HTML5`)
*   `dimensions`: String (e.g., "300x250")
*   `landing_page_url`: String (URL)

#### `Audience`
*   `id`: String
*   `type`: Enum (`URL_RULE`, `CRM_LIST`, `COMPOSITE`)
*   `rule`: String (e.g., "url contains /checkout")
*   `duration_days`: Integer (e.g., 30, 90)
*   `size_estimate`: Integer

---

## FuseIQ Mapping Notes

*Added: Dec 9, 2024*

### Navigation Mapping to Canvas Windows

| AdRoll Section | FuseIQ Window Type | Notes |
|----------------|-------------------|-------|
| Home | `portfolio` | Dashboard/overview window |
| Campaigns | `campaign` | Individual campaign windows |
| Audiences | `audience-insights` | Audience builder/viewer |
| Creatives | `creative-library` (new) | Asset management window |
| Analytics | `report` | Reporting windows |
| AI Assistant | Chat (docked/floating) | Our agent interface |
| Integrations | `settings` or dedicated | Platform connections |
| Settings | `settings` | Account configuration |

### Data Model Alignment

Our current types vs. AdRoll schema:

| AdRoll Entity | FuseIQ Equivalent | Gap Analysis |
|---------------|-------------------|--------------|
| Campaign | Campaign | Aligned - we have objective, status, budget |
| AdGroup | Flight | Similar concept - our flights group placements |
| Creative | (not yet modeled) | Need creative asset types |
| Audience | (partial in targeting) | Need dedicated Audience entity |

### Core Loop Implementation in FuseIQ

1. **Pixel → Audience**: Phase 6 (Platform Integrations) will handle pixel data
2. **Audience → Creative → Campaign**: Our campaign/flight/placement structure
3. **Campaign → Analytics**: Report windows with our export system
4. **AI Assistant**: AgentBrain with window context awareness

### Priority Gaps to Address

1. **Creative Library**: No dedicated creative management yet
2. **Audience Entity**: Currently embedded in targeting, needs extraction
3. **Pixel/Event Tracking**: No event ingestion layer yet
4. **Attribution Models**: We reference these but don't calculate them

---

*Last updated: Dec 9, 2024*
