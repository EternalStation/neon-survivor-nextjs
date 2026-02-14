const formatLargeNum = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
};

const testCases = [
    "3000000000",
    "123456",
    1000,
    "500",
    "0"
];

testCases.forEach(val => {
    try {
        console.log(`Input: ${val} (${typeof val}) -> Output: ${formatLargeNum(val)}`);
    } catch (e) {
        console.error(`Input: ${val} -> Error: ${e.message}`);
    }
});
