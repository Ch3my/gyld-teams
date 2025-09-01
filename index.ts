import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import seedrandom from 'seedrandom';

// Interfaces
interface Player {
    player_id: string;
    historical_event_engagements: number;
    historical_messages_sent: number;
    days_active_last_30: number;
    engagement_score: number;
}

interface Team {
    id: number;
    players: Player[];
    total_engagement_score: number;
}

function shuffle(array: any[], rng: () => number) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(rng() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

// Main function
async function main() {
    // Parse command line arguments
    const argv = await yargs(hideBin(process.argv))
        .options({
            teams: { type: 'number', demandOption: true, describe: 'Number of teams to create' },
            seed: { type: 'number', demandOption: true, describe: 'Seed for the random number generator' },
            debug: { type: 'boolean', default: false, describe: 'Enable debug logging' },
        })
        .argv;

    const numTeams = argv.teams;
    const seed = argv.seed;
    const debug = argv.debug;

    // 1. Data Processing and Scoring
    const players = readAndProcessPlayerData();

    // 2. Randomized Assignment with Multiple Trials
    const trials = 10;
    let bestAssignment: Team[] = [];
    let lowestStdDev = Infinity;
    let bestTrialIndex = -1; // To store the index of the best trial

    if (debug) {
        console.log('--- Starting Trials ---');
    }

    for (let i = 0; i < trials; i++) {
        const trialSeed = `${seed}-${i}`;
        const rng = seedrandom(trialSeed);

        // Shuffle players
        let shuffledPlayers = [...players];
        shuffle(shuffledPlayers, rng);

        // Assign players to teams using snake draft
        const teams: Team[] = Array.from({ length: numTeams }, (_, id) => ({
            id: id + 1,
            players: [],
            total_engagement_score: 0,
        }));

        shuffledPlayers.forEach(player => {
            teams.sort((a, b) => a.total_engagement_score - b.total_engagement_score);
            const targetTeam = teams[0];
            if (targetTeam) {
                targetTeam.players.push(player);
                targetTeam.total_engagement_score += player.engagement_score;
            }
        });

        // Calculate standard deviation of average team scores
        const teamAvgs = teams.map(t => t.total_engagement_score / (t.players.length || 1));
        const stdDev = calculateStandardDeviation(teamAvgs);

        if (debug) {
            const sortedTeams = [...teams].sort((a, b) => a.id - b.id);
            const teamAvgScores = sortedTeams.map(t => (t.total_engagement_score / (t.players.length || 1)).toFixed(4));
            console.log(`Trial ${i + 1}: Standard Deviation = ${stdDev.toFixed(4)}, Team Averages: [${teamAvgScores.join(', ')}]`);
        }

        if (stdDev < lowestStdDev) {
            lowestStdDev = stdDev;
            bestAssignment = teams;
            bestTrialIndex = i + 1; // Update best trial index
        }
    }

    if (debug) {
        console.log('--- Trials Complete ---');
        console.log(`Best Trial: ${bestTrialIndex}/${trials}`);
    }

    // 3. Output the Results
    console.log('\n--- Final Team Assignment ---');
    bestAssignment.sort((a,b) => a.id - b.id);
    bestAssignment.forEach(team => {
        team.players.forEach(player => {
            console.log(`${player.player_id} -> new_team_${team.id}`);
        });
    });

    console.log('\n--- Team Summary ---');
    bestAssignment.forEach(team => {
        const avgEngagement = team.total_engagement_score / (team.players.length || 1);
        console.log(`Team ${team.id}:`);
        console.log(`  - Size: ${team.players.length}`);
        console.log(`  - Average Engagement Score: ${avgEngagement.toFixed(4)}`);
    });

    console.log('\n--- Justification ---');
    console.log('The average engagement score is a trustworthy fairness statistic for the shuffle because it represents a player\'s overall contribution and activity. By balancing this score across teams, we ensure that each team has a similar level of overall engagement, leading to a fair and balanced distribution of active and engaged players.');
}

function readAndProcessPlayerData(): Player[] {
    const csvData = fs.readFileSync('level_a_players_csv.csv', 'utf-8');
    const records: any[] = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        cast: true,
        delimiter: ';',
        trim: true,
        bom: true,
    });

    const players: Player[] = records.map(record => ({
        player_id: record.player_id,
        historical_event_engagements: record.historical_event_engagements,
        historical_messages_sent: record.historical_messages_sent,
        days_active_last_30: record.days_active_last_30,
        engagement_score: 0, // will be calculated next
    }));

    // Normalize metrics and calculate engagement score
    const metrics: (keyof Player)[] = ['historical_event_engagements', 'historical_messages_sent', 'days_active_last_30'];
    const normalizedPlayers = normalizeAndScore(players, metrics);

    return normalizedPlayers;
}

function normalizeAndScore(players: Player[], metrics: (keyof Player)[]): Player[] {
    const minMax: { [key: string]: { min: number; max: number } } = {};

    metrics.forEach(metric => {
        const values = players.map(p => p[metric] as number);
        minMax[metric] = { min: Math.min(...values), max: Math.max(...values) };
    });

    return players.map(player => {
        let normalizedScoreSum = 0;
        metrics.forEach(metric => {
            const value = player[metric] as number;
            const minMaxMetric = minMax[metric];
            if (minMaxMetric) {
                const { min, max } = minMaxMetric;
                const normalizedValue = (max - min) === 0 ? 0 : (value - min) / (max - min);
                normalizedScoreSum += normalizedValue;
            }
        });

        // Weighted sum (equal weights)
        player.engagement_score = normalizedScoreSum / metrics.length;
        return player;
    });
}

function calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length === 0) {
        return 0;
    }
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
}

main().catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
});
