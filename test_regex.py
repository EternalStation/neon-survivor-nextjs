import os
import re

content = "import type { GameState, Enemy } from '../types';"
import_pattern = re.compile(r"(['\"])(@/logic/|(?:\./|\.\./)+)([^'\"]+)(['\"])")

def replacer(match):
    print(f"Match found: {match.groups()}")
    return match.group(0)

import_pattern.sub(replacer, content)
