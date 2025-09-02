## Run Instructions

### Prerequisites

*   Node.js 

### Installation

1.  Clone the repository or download the source code.
2.  Open a terminal in the project directory.
3.  Install the dependencies:

```bash
npm install
```

### Usage

Run the application using `npx ts-node`. You must provide the number of teams and a seed for the random number generator.

```bash
npx ts-node index.ts --teams <number_of_teams> --seed <seed_number>
```

**Example:**

```bash
npx ts-node index.ts --teams 5 --seed 42
```

### Debug Mode

To see the standard deviation and average engagement scores for each team in every trial, use the `--debug` flag:

```bash
npx ts-node index.ts --teams 5 --seed 42 --debug
```

## Overall Approach & Key Tradeoffs

The core of this application is a randomized assignment algorithm that leverages a "snake draft" method across multiple trials to achieve the most balanced team distribution. Due to the time limit, certain tradeoffs were made in favor of delivering a functional and robust solution that meets the core requirements.

**Tradeoff: Depth of Optimization (and its implications for time)**

*   **Decision Made (X):** The primary focus was on implementing the core algorithm and ensuring its correctness and reproducibility.
*   **Reasoning (Y - influenced by time limit):** Given the time constraints, deep algorithmic optimizations (e.g., exploring alternative data structures for the snake draft's team selection beyond simple array sorting) were not pursued. The current approach, while functional, could be made more performant for extremely large datasets. This was a conscious tradeoff to deliver a complete, working solution within the timeframe.

## Modeling Choices

### Engagement Score Weighting

"Engagement Score" as a weighted sum of `historical_event_engagements`, `historical_messages_sent`, and `days_active_last_30`.

*   **Choice:** I opted for **equal weighting** (1/3 for each metric) after normalizing each metric to a 0-1 range.
*   **Why:** In the absence of explicit guidance, equal weighting provides a neutral and unbiased approach, assuming each metric contributes equally to a player's overall engagement. If more data or domain expertise were available, these weights could be fine-tuned.

### Tie-Break Rule

When assigning players, the snake draft method relies on sorting teams by their `total_engagement_score`.

*   **Rule:** If two or more teams have the exact same `total_engagement_score` during a player assignment step, their relative order in the `teams.sort()` operation is determined by their original order in the array. This is a stable sort.
*   **How it's handled:** The initial random shuffle of players (using the seeded Fisher-Yates algorithm) ensures that even if players have identical engagement scores, their initial position in the shuffled list is random and reproducible. This randomness propagates through the snake draft, ensuring that the final assignment is deterministic for a given seed.

## Assumptions

*   **Level A Data Only:** This project exclusively used data from `level_a_players_csv.csv`. No assumptions were made or data utilized from "Level B".
*   **Equal Engagement Metric Importance:** As noted in "Modeling Choices," the three engagement metrics are assumed to be of equal importance for the composite score.

## If I Had More Time, I Would...

*   **Explore Different Weighting Schemes:** Implement configurable weights for the engagement score metrics, potentially allowing for user input or optimization based on further analysis of player data.
*   **Advanced Balancing Metrics:** Investigate other metrics for team balance beyond just the standard deviation of average engagement scores. For example, balancing specific player roles or skill sets if such data were available.
*   **Performance Optimization:** For a very large number of players or teams, the current sorting within the loop could become a bottleneck. I would explore more optimized data structures or algorithms for team selection.
*   **More Robust CSV Handling:** Implement more comprehensive error handling for CSV parsing, such as handling malformed rows or missing data gracefully.
*   **Command Line Interface Enhancements:** Add more robust validation for command-line arguments and potentially more output options or debug mechanisms to visualize data.

## Indication of AI Usage

This project was developed with the assistance of AI, using Gemini CLI.

## Time Spent

Approximately 02:00 (hh:mm)
