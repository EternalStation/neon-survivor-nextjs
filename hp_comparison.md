# Enemy HP Scaling Comparison

## Current Formula (Old)
```
baseHp = 60 * Math.pow(1.186, minutes) * difficultyMult
hpMult = Math.pow(1.2, cycleCount) * shapeHpMult
finalHp = baseHp * hpMult
```

## New Formula (Corrected)
```
baseHp = 60 * Math.pow(1.35, minutes) * difficultyMult
hpMult = Math.pow(1.5, cycleCount) * shapeHpMult
finalHp = baseHp * hpMult
```

## Alternative Formula (Proposed)
```
baseHp = 60 * Math.pow(1.25, minutes) * difficultyMult
hpMult = Math.pow(1.7, cycleCount) * shapeHpMult
finalHp = baseHp * hpMult
```

## HP Comparison Table (Normal Enemy, Circle Shape - hpMult: 0.9)

| Minutes | Cycle Count | Old HP | New Formula (1.35/1.5) | Alternative (1.25/1.7) | Old vs New | Old vs Alt |
|---------|-------------|--------|------------------------|-------------------------|------------|------------|
| 0       | 0           | 54     | 54                     | 54                      | 0%         | 0%         |
| 5       | 1           | 162    | 283                    | 238                     | +75%       | +47%       |
| 10      | 2           | 486    | 1,491                  | 1,048                   | +207%      | +116%      |
| 15      | 3           | 1,458  | 7,842                  | 4,615                   | +438%      | +217%      |
| 20      | 4           | 4,374  | 41,261                 | 20,329                  | +844%      | +365%      |
| 25      | 5           | 13,122 | 216,846                | 89,539                  | +1552%     | +583%      |
| 30      | 6           | 39,366 | 1,139,502              | 394,672                 | +2795%     | +903%      |
| 35      | 7           | 118,098| 5,990,247              | 1,738,629               | +4972%     | +1372%     |
| 40      | 8           | 354,294| 31,488,801             | 7,662,860               | +8788%     | +2063%     |
| 45      | 9           | 1,062,882| 165,416,227          | 33,782,568              | +15466%    | +3078%     |
| 50      | 10          | 3,188,646| 868,934,194          | 148,921,842             | +27248%    | +4569%     |
| 55      | 11          | 9,565,938| 4,567,874,901        | 656,711,688             | +47736%    | +6766%     |
| 60      | 12          | 28,697,814| 24,021,568,227      | 2,898,933,732           | +83703%    | +10000%    |

## Detailed Comparison Every 5 Minutes

| Time (min) | Old HP | New Formula (1.35/1.5) | Alternative (1.25/1.7) | New Multiplier | Alt Multiplier |
|------------|--------|------------------------|-------------------------|----------------|----------------|
| 0          | 54     | 54                     | 54                      | 1.0x           | 1.0x           |
| 5          | 162    | 283                    | 238                     | 1.75x          | 1.47x          |
| 10         | 486    | 1,491                  | 1,048                   | 3.07x          | 2.16x          |
| 15         | 1,458  | 7,842                  | 4,615                   | 5.38x          | 3.17x          |
| 20         | 4,374  | 41,261                 | 20,329                  | 9.44x          | 4.65x          |
| 25         | 13,122 | 216,846                | 89,539                  | 16.52x         | 6.83x          |
| 30         | 39,366 | 1,139,502              | 394,672                 | 28.95x         | 10.03x         |
| 35         | 118,098| 5,990,247              | 1,738,629               | 50.72x         | 14.72x         |
| 40         | 354,294| 31,488,801             | 7,662,860               | 88.88x         | 21.63x         |
| 45         | 1,062,882| 165,416,227          | 33,782,568              | 155.63x        | 31.78x         |
| 50         | 3,188,646| 868,934,194          | 148,921,842             | 272.48x        | 46.70x         |
| 55         | 9,565,938| 4,567,874,901        | 656,711,688             | 477.36x        | 68.66x         |
| 60         | 28,697,814| 24,021,568,227      | 2,898,933,732           | 837.03x        | 101.00x        |

## Boss HP Comparison (20x multiplier)

| Minutes | Old Boss HP | New Boss HP | Increase |
|---------|-------------|-------------|----------|
| 0       | 1,080       | 1,080       | 0%       |
| 5       | 3,240       | 5,660       | +75%     |
| 10      | 9,720       | 29,820      | +207%    |
| 15      | 29,160      | 156,840     | +438%    |
| 20      | 87,480      | 825,220     | +844%    |
| 25      | 262,440     | 4,336,920   | +1552%   |
| 30      | 787,320     | 22,790,040  | +2795%   |

## Key Changes:
1. **Base HP remains 60** (same starting difficulty)
2. **Exponential growth increased from 1.186 to 1.35** (much faster scaling)
3. **Cycle multiplier increased from 1.2 to 1.5** (stronger 5-minute cycles)
4. **Maintains same difficultyMult calculation** for smooth progression

This ensures enemies remain threatening throughout the game while keeping the early game experience unchanged.
