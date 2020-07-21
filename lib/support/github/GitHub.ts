export default interface GitHub {
  /**
   * Returns the first 1000 tags of the given repository.
   * The returned tags are without a refs/tags prefix.
   *
   * @param repo Repository name which tags should be returned.
   */
  getTags(repo: string): Promise<string[]>;

  /**
   * Rebase origin branch to the upstream branch.
   *
   * @param repo
   * @param originBranch
   * @param upstreamBranch
   */
  rebase(repo: string, originBranch: string, upstreamBranch: string): Promise<void>;

  /**
   * Raise a pull request from an origin branch to the upstream branch.
   *
   * @param repo
   * @param originBranch
   * @param upstreamBranch
   * @param title
   */
  raisePullRequest(repo: string, originBranch: string, upstreamBranch: string, title: string): Promise<void>;
}
