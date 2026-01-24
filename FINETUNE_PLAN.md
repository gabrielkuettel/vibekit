# Algorand Code Model Fine-Tuning Plan

Fine-tune a code-specialized LLM on Algorand TypeScript to create the first "Algorand-native" code model.

**Timeline:** 4-5 weeks
**Budget:** ~$150-400
**Goal:** Model that produces compiling Algorand code on first try

---

## Model Selection Summary

| Model | Params (Total/Active) | HumanEval | SWE-bench | VRAM (QLoRA) | Best For |
|-------|----------------------|-----------|-----------|--------------|----------|
| Qwen2.5-Coder-7B | 7B/7B | 87.8% | ~35% | ~8GB | Budget/fast iteration |
| **Qwen3-Coder-30B-A3B** | 30B/3B | 70.7% | 50.3% | ~17.5GB | Best coding performance |
| **Nemotron 3 Nano 30B-A3B** | 30B/3B | 78.1% | ~50% | ~17GB | Fast inference, agentic tasks |

**Recommended: Qwen3-Coder-30B-A3B-Instruct**
- Purpose-built "Coder" variant with 256K context
- 50.3% SWE-bench (real-world coding)
- [Unsloth fine-tuning support](https://unsloth.ai/docs/models/qwen3-how-to-run-and-fine-tune) in 17.5GB VRAM
- MoE architecture: only 3B params active per token (efficient inference)

**Alternative: Nemotron 3 Nano 30B-A3B**
- 3.3x faster inference (Mamba-Transformer hybrid)
- Better math/reasoning (83% vs 61% on MATH)
- [NVIDIA fine-tuning recipes](https://github.com/NVIDIA-NeMo/Nemotron)
- More complex setup (NeMo/Megatron)

---

## Phase 1: Data Collection (Week 1)

### 1.1 Repository Targets

**Tier 1 - Official/Foundation (highest quality)**
| Repository | Est. LOC | Quality |
|------------|----------|---------|
| algorandfoundation/algokit-utils-ts | ~15K | Excellent |
| algorandfoundation/algokit-typescript-template | ~5K | Excellent |
| algorand-devrel/TEALScript | ~20K | Excellent |
| algorand/js-algorand-sdk | ~30K | Good |

**Tier 2 - Educational**
| Repository | Est. LOC | Quality |
|------------|----------|---------|
| algorand-bootcamp/ts-beginner-en | ~3K | Good |
| algorand-devrel/algorand-agent-skills | varies | Excellent (curated) |

**Tier 3 - Community (50+ stars)**
- TinymanOrg/tinyman-js-sdk
- folks-finance/folks-finance-js-sdk
- 20-30 additional community repos with 50+ stars

### 1.2 Extraction Rules

**Include:**
- `*.ts` files
- `*.contract.ts` files (TEALScript contracts)
- Contract examples and tests

**Exclude:**
- `*.d.ts` (type definitions only)
- `node_modules/`, `dist/`, `build/`
- Generated files
- Files < 10 LOC or > 500 LOC

### 1.3 Deliverable

~100K LOC raw code → ~40K LOC after deduplication

---

## Phase 2: Quality Filtering (Week 1-2)

### 2.1 Automated Filters

| Filter | Threshold | Rationale |
|--------|-----------|-----------|
| Cyclomatic complexity | < 15 | Remove overly complex code |
| Function length | 10-100 lines | Not too trivial, not too long |
| Comment ratio | > 5% | Indicates documented code |
| Import patterns | Modern only | Remove deprecated SDK usage |
| Type coverage | > 80% | Well-typed code only |

### 2.2 Pattern Blocklist

Remove code containing:
- `algosdk.makePaymentTxn` (old SDK pattern)
- PyTEAL references
- Beaker imports
- `@ts-ignore` / `@ts-nocheck`
- Placeholder code (`// TODO`, `throw new Error('not implemented')`)

### 2.3 License Verification

Only include code with permissive licenses:
- MIT
- Apache 2.0
- BSD-3-Clause

### 2.4 Deliverable

~20-25K LOC high-quality code

---

## Phase 3: Instruction Dataset Creation (Week 2-3)

### 3.1 Dataset Format (Alpaca)

```json
{
  "instruction": "Write a function to send an Algorand payment transaction",
  "input": "sender: Account, receiver: string, amount: number in microAlgos",
  "output": "export async function sendPayment(\n  algorand: AlgorandClient,\n  sender: Account,\n  receiver: string,\n  amount: number\n): Promise<string> {\n  const result = await algorand.send.payment({\n    sender: sender.addr,\n    receiver,\n    amount: AlgoAmount.MicroAlgo(amount)\n  })\n  return result.txIds[0]\n}"
}
```

### 3.2 Data Generation Strategies

**Strategy A: Documentation Extraction (2-3K pairs)**
- Extract from JSDoc comments
- Parse README examples
- Convert inline comments to instructions

**Strategy B: LLM Synthesis (3-5K pairs)**
- Use Claude/GPT-4 to generate instructions for existing code
- Prompt: "Given this Algorand TypeScript code, write a natural language instruction that would produce it"
- Cost: ~$20-50 in API calls

**Strategy C: Pattern Mining (1-2K pairs)**
- Identify common patterns:
  1. Payment transactions
  2. Asset creation/transfer/opt-in
  3. Smart contract deployment
  4. App calls (ABI methods)
  5. State reading (global/local/box)
  6. Atomic transaction groups
  7. Transaction simulation
  8. Error handling patterns
- Create variations with different parameters

### 3.3 Quality Assurance

For each instruction pair:
1. **Compile check** - Does the output compile?
2. **Type check** - Passes `tsc --noEmit`?
3. **Semantic check** - Does instruction match output?
4. **Diversity check** - Not too similar to existing pairs

### 3.4 Deliverable

6,000-10,000 instruction pairs

---

## Phase 4: Training (Week 3-4)

### 4.1 Model Selection

**Primary: Qwen3-Coder-30B-A3B-Instruct** ([HuggingFace](https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct))
- 30B total params, 3B active per token (MoE)
- 256K native context, extendable to 1M with YARN
- 50.3% SWE-bench Verified (real-world coding tasks)
- Purpose-built for code generation
- Permissive license
- Size: ~60GB full, ~17.5GB VRAM with QLoRA

**Alternative: Nemotron 3 Nano 30B-A3B** ([HuggingFace](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16))
- Hybrid Mamba-Transformer MoE (3.3x faster inference)
- 78.1% HumanEval, strong math/reasoning
- 1M token context window
- Requires NeMo framework for fine-tuning
- Open weights, training data, and recipes

**Fallback: Qwen2.5-Coder-7B-Instruct**
- Use for fast iteration or budget constraints
- Fits on consumer GPUs (RTX 3090/4090)
- 87.8% HumanEval, ~8GB VRAM

### 4.2 Training Method: QLoRA with Unsloth

[Unsloth](https://unsloth.ai/docs/models/qwen3-how-to-run-and-fine-tune) enables 2x faster training with 70% less VRAM.

```yaml
# Training hyperparameters for Qwen3-Coder-30B-A3B
base_model: Qwen/Qwen3-Coder-30B-A3B-Instruct
quantization: 4bit (nf4)
lora_r: 64
lora_alpha: 128
lora_dropout: 0.05
target_modules: ["q_proj", "k_proj", "v_proj", "o_proj"]
# Note: Do NOT fine-tune router layer on MoE models

learning_rate: 2e-4
batch_size: 2
gradient_accumulation: 8
epochs: 3
warmup_ratio: 0.03
lr_scheduler: cosine

max_seq_length: 4096
```

**Hardware Requirements:**
- Qwen3-30B-A3B: Single A100 40GB or 2x RTX 4090 (24GB each)
- Qwen2.5-7B: Single RTX 3090/4090 (24GB) or A10 (24GB)

### 4.3 Training Infrastructure Options

| Platform | GPU Options | Pros | Est. Cost |
|----------|-------------|------|-----------|
| [Unsloth + Colab Pro](https://unsloth.ai) | A100 40GB | Easiest setup, 2x faster | $50-100 |
| [Modal.com](https://modal.com) | A100/H100 | Serverless, pay-per-second | $80-200 |
| [RunPod](https://runpod.io) | A100 40GB | $1.89/hr, cheapest for long runs | $50-150 |
| [Lambda Labs](https://lambdalabs.com) | A100/H100 | Research-friendly | $80-200 |

**Recommended:** Start with Unsloth + Colab Pro for prototyping, move to RunPod for final training.

### 4.4 Training Monitoring

Track:
- Training loss (should decrease steadily)
- Validation loss (watch for overfitting gap)
- Perplexity on held-out Algorand code
- Learning rate schedule
- GPU memory utilization

### 4.5 Deliverable

Fine-tuned LoRA adapter weights (~500MB-2GB)

---

## Phase 5: Evaluation (Week 4)

### 5.1 Benchmark Suite

**General Code Ability**
- HumanEval (164 problems) - baseline sanity check
- Target: > 80% (maintain base model performance)

**Algorand-Specific Suite (50+ problems)**

| Category | # Problems | Examples |
|----------|------------|----------|
| Transactions | 15 | Payment, asset transfer, grouped |
| Contracts | 10 | Deploy, call methods, opt-in |
| State | 10 | Read global/local/box, decode |
| Assets | 10 | Create, configure, freeze |
| Error handling | 5 | Proper try/catch, error decoding |

### 5.2 Success Metrics

| Metric | Minimum | Target |
|--------|---------|--------|
| Compile success rate | > 85% | > 95% |
| Deploy success rate | > 75% | > 90% |
| Type check pass rate | > 80% | > 95% |
| Algorand suite score | > 65% | > 85% |
| HumanEval (baseline) | > 65% | > 75% |

Note: HumanEval may slightly decrease from base model (70.7%) due to domain specialization - this is acceptable if Algorand-specific metrics improve significantly.

### 5.3 Comparison Baselines

Compare against:
1. Base Qwen3-Coder-30B-A3B (no fine-tuning)
2. Nemotron 3 Nano 30B-A3B (no fine-tuning)
3. Claude Sonnet 4 on same tasks
4. GPT-4o on same tasks

### 5.4 Deliverable

Benchmark results document, go/no-go decision

---

## Phase 6: Integration (Week 5+)

### 6.1 Deployment Options

**Option A: Self-Hosted (vLLM) - Recommended for MoE**
```bash
# vLLM has best MoE support
python -m vllm.entrypoints.openai.api_server \
  --model ./algorand-coder-30b-a3b \
  --tensor-parallel-size 1 \
  --port 8000
```

**Option B: Self-Hosted (Ollama)**
```bash
# Convert to GGUF first, or use pre-converted
ollama create algorand-coder -f Modelfile
ollama run algorand-coder "Write a payment transaction"
```

**Option C: Cloud API (Modal/RunPod)**
```typescript
// OpenAI-compatible endpoint
const client = new OpenAI({
  baseURL: "https://your-deployment.modal.run/v1",
  apiKey: process.env.MODAL_API_KEY
})

const response = await client.chat.completions.create({
  model: "algorand-coder-30b",
  messages: [{ role: "user", content: instruction }]
})
```

### 6.2 VibeKit MCP Integration

New tool: `generate_algorand_code`

```typescript
export const generateCodeTool: Tool = {
  name: 'generate_algorand_code',
  description: 'Generate Algorand TypeScript code using the fine-tuned model',
  inputSchema: {
    type: 'object',
    properties: {
      instruction: {
        type: 'string',
        description: 'What code to generate'
      },
      context: {
        type: 'string',
        description: 'Optional context (existing code, types, etc.)'
      }
    },
    required: ['instruction']
  }
}
```

### 6.3 Hybrid Approach

| Task | Use Fine-Tuned Model | Use Claude |
|------|---------------------|------------|
| Contract code generation | Yes | |
| Transaction construction | Yes | |
| Boilerplate/patterns | Yes | |
| Complex reasoning | | Yes |
| Multi-step planning | | Yes |
| Error diagnosis | | Yes |
| Natural language responses | | Yes |

---

## Cost Breakdown

| Item | Estimated Cost |
|------|----------------|
| LLM API for instruction generation | $30-80 |
| GPU training (A100 40GB, ~20-40 hrs) | $80-200 |
| Hosting/inference (first month) | $50-100 |
| **Total to MVP** | **$160-380** |

**GPU Cost Reference:**
- RunPod A100 40GB: $1.89/hr
- Modal A100 40GB: $2.78/hr (pay-per-second)
- Colab Pro+: $49.99/mo (includes A100 access)

**Ongoing Inference:**
- Self-hosted (vLLM/Ollama): ~$1-2/hr when running
- Cloud API (if hosted): ~$0.001-0.002/1K tokens

---

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Not enough quality data | Medium | Supplement with synthetic generation; lower to 5K pairs |
| Model still hallucinates | Medium | Combine with compile validation tool; iterate on training |
| Overfitting to examples | Medium | Hold out 20% for validation; use dropout |
| Oxen.ai limitations | Low | Fallback to Modal/RunPod |
| License issues | Low | Verify all source repos before training |
| Worse than base model | Low | Extensive evaluation before deployment |

---

## Decision Checkpoints

### End of Week 2: Data Quality Gate
- Do we have 5,000+ quality instruction pairs?
- If no: extend data generation or reduce scope

### End of Week 4: Model Quality Gate
- Does model meet minimum success metrics?
- If no: iterate on training or adjust approach

### End of Week 5: Integration Decision
- Is model better than prompting Claude/GPT-4 for Algorand tasks?
- If no: document learnings, consider as future work

---

## Project Structure

```
vibekit/
├── training/
│   ├── scripts/
│   │   ├── clone-repos.sh           # Clone target repositories
│   │   ├── extract-code.py          # Extract TypeScript files
│   │   ├── filter-quality.py        # Apply quality filters
│   │   ├── generate-instructions.py # Create instruction pairs
│   │   └── prepare-dataset.py       # Final train/val split
│   ├── data/
│   │   ├── raw/                     # Cloned repos
│   │   ├── extracted/               # Filtered TypeScript
│   │   ├── instructions/            # Generated pairs
│   │   └── final/                   # Train/val split (Alpaca format)
│   ├── evaluation/
│   │   ├── algorand-suite/          # Custom benchmark problems
│   │   ├── run-eval.py              # Evaluation script
│   │   └── results/                 # Benchmark results
│   └── config/
│       ├── training.yaml            # QLoRA hyperparameters
│       └── repos.txt                # List of repos to clone
```

---

## Why This Creates a Moat

1. **Data curation effort** - Competitors must replicate same work
2. **First-mover advantage** - "The Algorand model" becomes synonymous with VibeKit
3. **Compounds over time** - Model improves as more code is generated and validated
4. **Algorand Foundation alignment** - Natural partnership/endorsement opportunity
5. **Can't be easily forked** - Training data curation and model weights are proprietary

---

## Next Steps

1. [ ] Set up `training/` directory structure
2. [ ] Create `repos.txt` with full list of target repositories
3. [ ] Write `clone-repos.sh` script
4. [ ] Write `extract-code.py` with Tree-sitter parsing
5. [ ] Begin data collection (Week 1)
