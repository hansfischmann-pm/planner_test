# AdRoll/RollWorks Migration Brief

> This document captures the capabilities, visual structures, features, and technical details of the AdRoll and RollWorks platforms (both NextRoll brands) for migration to FuseIQ.

---

## 1. Scope and Sources

**Sources Consulted:**
- **AdRoll API Overview:** `https://help.adroll.com/hc/en-us/articles/230162907-AdRoll-API-Overview`
- **NextRoll API Developer Guide:** Shared base URL, Auth, and v1 structure
- **RollWorks API Guide (B2B):** `https://apidocs.nextroll.com/guides/get-started-rollworks.html`

---

## 2. Core Platform Capabilities

| Capability Area | Description | FuseIQ Mapping |
| :--- | :--- | :--- |
| **Full-Funnel Advertising** | Managing campaigns for Awareness, Consideration, and Conversion across all channels. | Campaign objectives, funnel stage tracking |
| **Multi-Channel Delivery** | Orchestrating ad delivery across Display, Native, Video, Social (FB, Insta, TikTok, Pinterest). | Channel type in placements |
| **Audience Segmentation** | Using 1st-party data (pixel, CRM) and 3rd-party data to build targetable segments. | Segment system, audience browser |
| **AI-Powered Optimization** | Real-time bidding (BidIQ™) to optimize spend and placement. | Budget optimizer, recommendations |
| **ABM/B2B Focus (RollWorks)** | Targeting specific companies using firmographic, technographic, and intent data. | Account-based targeting segments |

---

## 3. Technical API Structure

| Detail | Specification | Implementation Notes |
| :--- | :--- | :--- |
| **Base URL** | `https://services.adroll.com` | All API requests use this base path |
| **API Version** | `/api/v1/` | All routes include versioning prefix |
| **Data Format** | **JSON** (Primary), **XML** (Legacy) | Use `application/json` content type |
| **Auth (Primary)** | **Personal Access Tokens (PAT)** | Header: `Authorization: Token [MYTOKEN]` |
| **Auth (Secondary)** | **OAuth 2.0** | Handle 24-hour token expiration with Refresh Token |
| **Required Context** | **Advertisable EID** | Retrieved from `organization/get_advertisables` |

---

## 4. RollWorks B2B/ABM Extension

| API Service | Key Endpoints | FuseIQ Feature |
| :--- | :--- | :--- |
| **Organization** | `GET /api/v1/organization/get_advertisables` | Account/brand management |
| **Pixel/Segment** | `POST /api/v1/rule/create` | Audience segment creation |
| **Campaign** | `POST /api/v1/campaign/create` | Campaign management |
| **Report** | `GET /api/v1/report/campaign`, `GET /api/v1/report/ad` | Analytics & attribution |
| **ABM Reporting** | `GET /api/v1/report/account_metrics` | Portfolio/account reporting |
| **Workflow** | `POST /api/v1/workflow/create_trigger` | Automation rules |

---

## 5. Key Performance Metrics

### A. Delivery & Cost Metrics
- Impressions
- Clicks
- Spend
- CPC, CPM, CPA

### B. Conversion & Value Metrics
- Conversions
- Total Conversions
- **Attributed Revenue**
- **ROAS** (Return on Ad Spend)
- AOV (Average Order Value)

### C. Rate Metrics
- CTR (Click-Through Rate)
- CTC Rate (Click-Through Conversion Rate)
- Conversion Rate

### D. B2B/ABM Metrics (RollWorks)
- **Accounts Reached**
- **Engaged Visitors**
- **Influenced Opportunities/Revenue**

---

## 6. Attribution Models

| Model Name | Logic | FuseIQ Support |
| :--- | :--- | :--- |
| **Last Click/Touch** | 100% credit to final touchpoint | ✅ Implemented |
| **First Touch** | 100% credit to initial touchpoint | ✅ Implemented |
| **Linear** | Equal credit across all touchpoints | ✅ Implemented |
| **Positional** | 40% / 20% / 40% distribution | ✅ Implemented |
| **Time Decay** | Most credit to touchpoints closest to conversion | ✅ Implemented |

---

## 7. Legacy System Navigation Map

### Top-Level Navigation
- **Home**: Main dashboard
- **Campaigns**: Management of ad campaigns
- **Audiences**:
  - Website Audiences
  - Connected Audiences
  - Contacts
- **Creatives**:
  - Ad Library
  - Product Feeds
- **Analytics**:
  - Insights
  - Cross-Channel
  - AdRoll Attribution
  - Campaign Reports
- **AI Assistant**: Side panel for AI help
- **Help & Support**: External links
- **Integrations**: Third-party service connections
- **Notifications**: System notifications panel
- **Settings**: Account and billing settings

---

## 8. Key Workflows

### Campaign Creation
- **Entry**: Campaigns > Create > Ad Campaign
- **Types**: Retargeting on Web, etc.
- **Steps**: Settings → Audience → Ads → Launch
- **Key Fields**: Name, Budget (Daily), Optimization Strategy, Target CPA

### Audience Creation
- **Entry**: Audiences > Website Audiences > New Audience
- **Key Fields**: Name, Type (URL Visited), URL Pattern, Duration (Days), Conversion Toggle

### Ad Creation
- **Entry**: Creatives > Ad Library > Upload
- **Method**: File upload (drag & drop)
- **Supported Formats**: mp4, mov, png, gif, jpg, zip
- **Key Metadata**: Name, Landing Page, Ad Type

---

## 9. Data Models (AdRoll)

### Campaign
```typescript
interface AdRollCampaign {
  name: string;
  status: 'Active' | 'Paused' | 'Completed';
  source: string;
  budget: number;  // Daily
  funnel_stage: string;
  spend: number;   // Cumulative
  impressions: number;
  optimization_strategy: string;
}
```

### Audience (Website)
```typescript
interface AdRollAudience {
  name: string;
  type: 'URL_VISITED' | 'PAGE_VISIT' | 'CUSTOM';
  rule: string;           // URL Pattern
  duration: number;       // Days
  is_conversion: boolean;
  estimated_size: number;
  unique_visitors: number;
}
```

### Ad (Creative)
```typescript
interface AdRollAd {
  name: string;
  type: 'Image' | 'Video' | 'HTML5';
  dimensions: string;     // e.g., "300x250"
  file_url: string;       // CDN path
  landing_page_url: string;
  status: string;
  created_at: Date;
}
```

---

## 10. FuseIQ Migration Mapping

| AdRoll Concept | FuseIQ Equivalent | Notes |
| :--- | :--- | :--- |
| Advertisable | Brand | Top-level account |
| Campaign | Campaign | Direct mapping |
| Ad Group | Flight | Budget/timing container |
| Ad | Placement/Line | Individual buy |
| Website Audience | Segment | Audience targeting |
| Connected Audience | Segment (CRM type) | Imported lists |
| Ad Creative | Creative asset | Future feature |
| Attribution Report | Attribution Dashboard | ✅ Built |
| Campaign Report | Post-Campaign Export | ✅ Built |

---

## 11. Integration Priority (Phase 6)

### High Priority
1. **Campaign Sync** - Import/export campaigns
2. **Audience Sync** - Import AdRoll segments
3. **Performance Data** - Pull delivery metrics
4. **Attribution Data** - Pull conversion data

### Medium Priority
5. **Creative Sync** - Link to Ad Library
6. **Workflow Triggers** - Mirror automation rules

### Lower Priority
7. **Real-time Bidding** - Advanced optimization
8. **Product Feeds** - E-commerce integration
