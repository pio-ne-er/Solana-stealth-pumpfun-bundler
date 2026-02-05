export function generateDistribution(
    totalValue: number,
    minValue: number,
    maxValue: number,
    num: number,
    mode: string,
): number[] {
    if (mode == "even") {
        let element = totalValue / num;
        let array: number[] = [];
        for (let i = 0; i < num; i++)
            array.push(element);
        return array
    }
    // Early checks for impossible scenarios
    if (num * minValue > totalValue || num * maxValue < totalValue) {
        console.log("🚀 ~ totalValue:", totalValue)
        console.log("🚀 ~ maxValue:", maxValue)
        console.log("🚀 ~ minValue:", minValue)
        console.log("🚀 ~ num:", num)
        throw new Error('Impossible to satisfy the constraints with the given values.');
    }
    // Start with an evenly distributed array
    let distribution: number[] = new Array(num).fill(minValue);
    let currentTotal: number = minValue * num;
    // Randomly add to each to reach totalValue
    // ensuring values stay within minValue and maxValue
    for (let i = 0; currentTotal < totalValue && i < 10000; i++) {
        for (let j = 0; j < num; j++) {
            // Calculate remaining space to ensure constraints are not broken
            const spaceLeft = Math.min(totalValue - currentTotal, maxValue - distribution[j]);
            if (spaceLeft <= 0) continue;
            // Randomly decide how much to add within the space left
            const addValue = Math.floor(Math.random() * (spaceLeft + 1));
            distribution[j] += addValue;
            currentTotal += addValue;
            // Break early if the target is reached
            if (currentTotal === totalValue) break;
        }
    }
    // In cases where distribution cannot reach totalValue due to rounding, adjust the last element
    // This is safe due to the initial constraints check ensuring a solution exists
    if (currentTotal !== totalValue) {
        const difference = totalValue - currentTotal;
        for (let i = distribution.length - 1; i >= 0; i--) {
            const potentialValue = distribution[i] + difference;
            if (potentialValue <= maxValue) {
                distribution[i] += difference;
                break;
            }
        }
    }
    return distribution;
}
