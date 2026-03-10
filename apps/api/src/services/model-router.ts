// ─── Smart Model Router ─────────────────────────────────────────
// Classifies task complexity with a cheap Haiku call, then routes
// to the appropriate model tier for cost optimization.

export type ModelTier = 'haiku' | 'sonnet' | 'opus';

export type TaskComplexity = 'discovery' | 'simple_action' | 'multi_step' | 'complex_reasoning';

export interface RoutingDecision {
  model: string;
  tier: ModelTier;
  estimatedCostCents: number;
  complexity: TaskComplexity;
}

const MODEL_MAP: Record<ModelTier, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250929',
  opus: 'claude-sonnet-4-5-20250929', // Use sonnet for complex tasks too (opus not yet available via API)
};

const COST_MAP: Record<ModelTier, number> = {
  haiku: 3,   // $0.03/task → 3 cents
  sonnet: 10, // $0.10/task → 10 cents
  opus: 17,   // $0.17/task → 17 cents
};

const COMPLEXITY_TO_TIER: Record<TaskComplexity, ModelTier> = {
  discovery: 'haiku',
  simple_action: 'haiku',
  multi_step: 'sonnet',
  complex_reasoning: 'opus',
};

// ─── Classify Task Complexity ───────────────────────────────────

const CLASSIFIER_SYSTEM_PROMPT = `You are a task complexity classifier. Given a user's task description and a list of available tools, classify the task into exactly ONE of these categories:

- discovery: Simple lookup, search, or information retrieval
- simple_action: Single action using 1-3 tools (send email, create file, post message)
- multi_step: Multi-step workflow using 4-8 tools (process data then notify, analyze then report)
- complex_reasoning: Complex analysis, reasoning across many data sources, 8+ tools involved

Respond with ONLY the category name, nothing else.`;

export async function classifyTaskComplexity(
  userInput: string,
  availableTools: string[]
): Promise<TaskComplexity> {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: MODEL_MAP.haiku,
      max_tokens: 32,
      system: CLASSIFIER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Task: ${userInput}\nAvailable tools (${availableTools.length}): ${availableTools.join(', ')}`,
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as unknown as { text: string }).text)
      .join('')
      .trim()
      .toLowerCase();

    if (text in COMPLEXITY_TO_TIER) {
      return text as TaskComplexity;
    }

    // Fallback: infer from tool count
    return inferComplexityFromTools(availableTools.length);
  } catch {
    // On classifier failure, infer from tool count
    return inferComplexityFromTools(availableTools.length);
  }
}

function inferComplexityFromTools(toolCount: number): TaskComplexity {
  if (toolCount <= 1) return 'discovery';
  if (toolCount <= 3) return 'simple_action';
  if (toolCount <= 8) return 'multi_step';
  return 'complex_reasoning';
}

// ─── Route to Model ─────────────────────────────────────────────

export function routeToModel(
  complexity: TaskComplexity,
  creatorMinTier?: ModelTier | null
): RoutingDecision {
  let tier = COMPLEXITY_TO_TIER[complexity];

  // Respect creator's minimum tier preference
  if (creatorMinTier) {
    const tierOrder: ModelTier[] = ['haiku', 'sonnet', 'opus'];
    const currentIdx = tierOrder.indexOf(tier);
    const minIdx = tierOrder.indexOf(creatorMinTier);
    if (minIdx > currentIdx) {
      tier = creatorMinTier;
    }
  }

  return {
    model: MODEL_MAP[tier],
    tier,
    estimatedCostCents: COST_MAP[tier],
    complexity,
  };
}

// ─── Convenience: Full Pipeline ─────────────────────────────────

export async function selectModel(
  userInput: string,
  availableTools: string[],
  creatorMinTier?: ModelTier | null
): Promise<RoutingDecision> {
  const complexity = await classifyTaskComplexity(userInput, availableTools);
  return routeToModel(complexity, creatorMinTier);
}
