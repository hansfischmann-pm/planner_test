# Portfolio Management & Optimization Guide

## Overview
The Portfolio Management suite enables agency admins and brand managers to oversee multiple campaigns simultaneously, analyze cross-campaign performance, and dynamically reallocate budgets to maximize efficiency.

## 1. Accessing the Portfolio
1.  Navigate to the main dashboard (Client Selection).
2.  In the sidebar navigation, click the **Portfolio** button (Briefcase icon).
3.  This opens the **Portfolio Dashboard**, aggregating data from all active campaigns for the selected brand/portfolio.

## 2. Portfolio Dashboard
The dashboard provides a high-level health check of your media investment.

### Key Metrics
-   **Total Spend**: Real-time aggregation of spend across all active campaigns.
-   **Total Revenue**: Total attributed revenue.
-   **Portfolio ROAS**: The weighted average Return on Ad Spend.
-   **Active Channels**: Count of unique channels (e.g., Search, Social, TV) currently running.

### Campaign List
A detailed table providing a snapshot of each campaign's status:
-   **Status**: Active, Paused, or Completed.
-   **Budget vs. Spend**: Tracks utilization.
-   **ROAS**: Color-coded performance indicator (Green > 2.0x, Orange < 2.0x).
-   **Action**: "Manage" button to drill down into specific campaign details.

## 3. Campaign Comparison Chart
*Visualizing Efficiency vs. Scale*

This scatter plot allows you to instantly identify your "Stars" and "Dogs".
-   **X-Axis (Spend)**: How much the campaign is costing.
-   **Y-Axis (ROAS)**: How efficient the campaign is.
-   **Bubble Size**: Represents total Revenue volume.

**How to use:**
-   **Top-Left (High ROAS, Low Spend)**: *Opportunity*. These campaigns are efficient but underfunded. Consider increasing budget.
-   **Bottom-Right (Low ROAS, High Spend)**: *Risk*. These campaigns are spending heavily but returning poorly. Consider cutting budget or optimizing.
-   **Top-Right (High ROAS, High Spend)**: *Stars*. These are your core drivers. Monitor to ensure they don't saturate.

## 4. Budget Optimizer
*AI-Assisted Budget Reallocation*

The Budget Optimizer allows you to shift funds from lower-performing campaigns to higher-performing ones without leaving the dashboard.

### How to Shift Budget
1.  **Select Source**: Choose a campaign to take funds *from*. The tool shows its current budget and ROAS.
2.  **Select Target**: Choose a campaign to move funds *to*.
3.  **Set Amount**: Use the slider to define the transfer amount (capped at 50% of source budget for safety).
4.  **Simulate**: The tool automatically calculates the **Projected Impact**.
    -   *Example*: "Moving $50k is estimated to increase revenue by $12.5k based on current ROAS."
5.  **Apply**: Click "Apply Budget Shift" to execute the change. The charts and tables will update immediately.

### AI Recommendations
The system analyzes your portfolio and provides a top-level recommendation, e.g., *"Shift $50k to 'Nike Q4 Brand Awareness'"*, based on historical performance data.

---

## FAQ

**Q: Can I undo a budget shift?**
A: Currently, shifts are applied immediately to the local session state. To revert, you can simply shift the funds back using the same tool.

**Q: Does this affect live campaigns immediately?**
A: In this version, changes are staged in the planning environment. You would need to "Save" or "Publish" the plan to push changes to buying platforms (DSP/Search/Social).
