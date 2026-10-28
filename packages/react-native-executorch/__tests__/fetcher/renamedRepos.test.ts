import { RENAMED_HF_REPOS, previousRepoUrl } from '../../src/fetcher/renamedRepos';

const ORG = 'https://huggingface.co/software-mansion';

describe('previousRepoUrl', () => {
  it('maps a renamed repo back to its previous name, keeping the path', () => {
    expect(previousRepoUrl(`${ORG}/Qwen3-ExecuTorch/resolve/v0.11.0/qwen_3_0_6b/model.pte`)).toBe(
      `${ORG}/react-native-executorch-qwen-3/resolve/v0.11.0/qwen_3_0_6b/model.pte`
    );
  });

  it('matches the repo name case-insensitively, as Hugging Face does', () => {
    expect(previousRepoUrl(`${ORG}/qwen3-executorch/resolve/v1/m.pte`)).toBe(
      `${ORG}/react-native-executorch-qwen-3/resolve/v1/m.pte`
    );
  });

  it('leaves previous-name, unrelated and non-renamed URLs alone', () => {
    for (const url of [
      `${ORG}/react-native-executorch-qwen-3/resolve/v1/m.pte`,
      `${ORG}/react-native-executorch-spec/resolve/main/config.schema.json`,
      `${ORG}/Qwen3-ExecuTorch-extra/resolve/v1/m.pte`,
      'https://huggingface.co/other-org/Qwen3-ExecuTorch/resolve/v1/m.pte',
      'https://example.com/Qwen3-ExecuTorch/m.pte',
    ]) {
      expect(previousRepoUrl(url)).toBe(url);
    }
  });

  it.each(Object.entries(RENAMED_HF_REPOS))(
    '%s maps to a react-native-executorch-* name',
    (next, previous) => {
      expect(next).toMatch(/-ExecuTorch$/);
      expect(previous).toMatch(/^react-native-executorch-/);
    }
  );

  it('has no duplicate new names, ignoring case', () => {
    const lower = Object.keys(RENAMED_HF_REPOS).map((name) => name.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });
});
