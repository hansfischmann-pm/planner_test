# Data Requirements: Advanced Attribution & Media Mix Modeling

This document outlines the data engineering requirements to enable next-generation attribution modeling in the Media Planner platform.

## 1. Algorithmic Multi-Touch Attribution (MTA)
**Goal:** Assign credit using probabilistic (Markov) or game-theoretic (Shapley) models rather than heuristics (First/Last Touch).

### Required Data: User-Level Journey Data
To train these models, we require granular, ordered sequences of user interactions.

| Field Name | Type | Description | Criticality |
| :--- | :--- | :--- | :--- |
| `user_id` | String | Unique identifier (cookie, device ID, or deterministic ID). | **Critical** |
| `timestamp` | Datetime | Precise time of the interaction. Order matters. | **Critical** |
| `channel` | String | High-level channel (e.g., "Search", "Social"). | **Critical** |
| `campaign_id` | String | Specific campaign identifier. | High |
| `interaction_type` | Enum | `impression`, `click`, `conversion`. | **Critical** |
| `conversion_id` | String | ID of the conversion event (if applicable). | **Critical** |
| `revenue` | Float | Value of the conversion. | High |

### Critical Requirement: Non-Converting Paths
*   **The Problem:** Most simple attribution only looks at *converters*.
*   **The Need:** For valid probabilistic modeling (Markov/Logistic Regression), we need **Null Journeys** — users who saw ads but *did not* convert. This allows the model to learn which touchpoints actually *increase* the probability of conversion vs. just happening frequently.

---

## 2. Media Mix Modeling (MMM)
**Goal:** Measure the incremental impact of marketing on sales using top-down statistical modeling (Regression/Bayesian). This is privacy-friendly and does not require user-level tracking.

### Required Data: Aggregate Time-Series (Weekly)
Data should be aggregated at a weekly level for at least **2 years** (104 weeks) to capture seasonality.

#### A. Dependent Variable (Target)
| Variable | Description |
| :--- | :--- |
| `weekly_sales` | Total revenue or sales volume per week. |

#### B. Media Variables (Marketing Inputs)
For *each* channel (TV, Search, Social, etc.):
| Variable | Description |
| :--- | :--- |
| `spend` | Media spend per week. |
| `impressions` | Impressions delivered per week (better for "Brand" channels). |
| `clicks` | Clicks delivered per week (better for "Performance" channels). |

#### C. Control Variables (Context)
To isolate true marketing impact, we must control for external factors:
| Variable | Description |
| :--- | :--- |
| `pricing` | Average product price per week (price elasticity). |
| `promotions` | Boolean (0/1) or intensity score for major sales events. |
| `seasonality` | Month of year indicators. |
| `holidays` | Flags for Black Friday, Christmas, etc. |
| `competitor_spend` | (Optional) Estimated spend of key competitors. |
| `economic_index` | (Optional) Consumer Confidence Index or similar macro factor. |

---

## 3. Implementation Roadmap
1.  **Phase 1 (Current):** Heuristic MTA (Rules-based) using mock/simplified data.
2.  **Phase 2 (Next):**
    *   **Data Engineering:** Build ETL pipelines to capture `user_journey` tables including non-converters.
    *   **Algorithm:** Implement basic **Markov Chain** (Removal Effect) in Python/R.
3.  **Phase 3 (MMM):**
    *   **Data Engineering:** Aggregate weekly spend/sales data into a flat CSV/Table.
    *   **Modeling:** Use open-source libraries like **Robyn (Meta)** or **LightweightMMM (Google)** for the initial model.
