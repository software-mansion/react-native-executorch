#include "Viterbi.h"

namespace rnexecutorch::models::privacy_filter::viterbi {

namespace {

constexpr float kNegInf = -1e30f;

struct LabelRole {
  char prefix; // 'O', 'B', 'I', 'E', 'S'
  std::string entity;
};

LabelRole classifyLabel(const std::string &name) {
  if (name == "O" || name.empty()) {
    return {'O', ""};
  }
  if (name.size() < 2 || name[1] != '-') {
    return {'O', ""};
  }
  return {name[0], name.substr(2)};
}

bool isValidTransition(const LabelRole &prev, const LabelRole &nxt) {
  // BIOES grammar:
  //   O / E-X / S-X -> O | B-* | S-*
  //   B-X / I-X     -> I-X | E-X  (same entity type)
  if (prev.prefix == 'O' || prev.prefix == 'E' || prev.prefix == 'S') {
    return nxt.prefix == 'O' || nxt.prefix == 'B' || nxt.prefix == 'S';
  }
  if (prev.prefix == 'B' || prev.prefix == 'I') {
    return (nxt.prefix == 'I' || nxt.prefix == 'E') &&
           nxt.entity == prev.entity;
  }
  return false;
}

float biasFor(const LabelRole &prev, const LabelRole &nxt, const Biases &b) {
  if (prev.prefix == 'O' && nxt.prefix == 'O') {
    return b.backgroundStay;
  }
  if (prev.prefix == 'O' && (nxt.prefix == 'B' || nxt.prefix == 'S')) {
    return b.backgroundToStart;
  }
  if ((prev.prefix == 'E' || prev.prefix == 'S') && nxt.prefix == 'O') {
    return b.endToBackground;
  }
  if ((prev.prefix == 'E' || prev.prefix == 'S') &&
      (nxt.prefix == 'B' || nxt.prefix == 'S')) {
    return b.endToStart;
  }
  if ((prev.prefix == 'B' || prev.prefix == 'I') && nxt.prefix == 'I') {
    return b.insideToContinue;
  }
  if ((prev.prefix == 'B' || prev.prefix == 'I') && nxt.prefix == 'E') {
    return b.insideToEnd;
  }
  return 0.0f;
}

} // namespace

Grammar buildGrammar(const std::vector<std::string> &labelNames,
                     const Biases &biases) {
  const size_t N = labelNames.size();
  std::vector<LabelRole> roles;
  roles.reserve(N);
  for (const auto &name : labelNames) {
    roles.emplace_back(classifyLabel(name));
  }

  Grammar grammar;
  grammar.numLabels = N;
  // transitionScore[i*N+j]: bias for valid transitions, -inf for invalid.
  // Fused float lets the inner loop avoid a validity branch.
  grammar.transitionScore.assign(N * N, kNegInf);
  for (size_t i = 0; i < N; ++i) {
    for (size_t j = 0; j < N; ++j) {
      if (isValidTransition(roles[i], roles[j])) {
        grammar.transitionScore[i * N + j] =
            biasFor(roles[i], roles[j], biases);
      }
    }
  }

  grammar.validStart.assign(N, false);
  for (size_t i = 0; i < N; ++i) {
    grammar.validStart[i] = (roles[i].prefix == 'O' || roles[i].prefix == 'B' ||
                             roles[i].prefix == 'S');
  }
  return grammar;
}

std::vector<int32_t> decode(const float *logits, int32_t validLen,
                            const Grammar &grammar) {
  if (validLen <= 0) {
    return {};
  }

  const size_t N = grammar.numLabels;
  std::vector<float> dp(N, kNegInf);
  std::vector<float> dpNext(N, kNegInf);
  std::vector<int32_t> bp(static_cast<size_t>(validLen) * N, 0);

  {
    const float *row0 = logits;
    for (size_t j = 0; j < N; ++j) {
      dp[j] = grammar.validStart[j] ? row0[j] : kNegInf;
    }
  }

  for (int32_t t = 1; t < validLen; ++t) {
    const float *rowT = logits + static_cast<size_t>(t) * N;
    for (size_t j = 0; j < N; ++j) {
      float best = kNegInf;
      int32_t bestPrev = 0;
      for (size_t i = 0; i < N; ++i) {
        const float trans = grammar.transitionScore[i * N + j];
        if (trans <= kNegInf / 2.0f) {
          continue;
        }
        const float cand = dp[i] + trans;
        if (cand > best) {
          best = cand;
          bestPrev = static_cast<int32_t>(i);
        }
      }
      dpNext[j] = best == kNegInf ? kNegInf : best + rowT[j];
      bp[static_cast<size_t>(t) * N + j] = bestPrev;
    }
    std::swap(dp, dpNext);
  }

  size_t bestEnd = 0;
  float bestScore = kNegInf;
  for (size_t j = 0; j < N; ++j) {
    if (dp[j] > bestScore) {
      bestScore = dp[j];
      bestEnd = j;
    }
  }

  std::vector<int32_t> path(static_cast<size_t>(validLen), 0);
  path[static_cast<size_t>(validLen) - 1] = static_cast<int32_t>(bestEnd);
  for (int32_t t = validLen - 1; t > 0; --t) {
    path[static_cast<size_t>(t) - 1] =
        bp[static_cast<size_t>(t) * N +
           static_cast<size_t>(path[static_cast<size_t>(t)])];
  }
  return path;
}

} // namespace rnexecutorch::models::privacy_filter::viterbi
