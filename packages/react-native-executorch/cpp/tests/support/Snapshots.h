#pragma once

#include <functional>
#include <string>
#include <utility>
#include <vector>

namespace rnexecutorch::tests::snapshots {

/**
 * Snapshot files pin what a third-party dependency produces (phonemis's
 * readings) without hard-coding it in the tests, so a bump that changes the
 * output is one command to accept and a diff to review, not strings to retype:
 *
 *   RNE_UPDATE_SNAPSHOTS=1 scripts/run-native-tests.sh -R <suite>
 *
 * A file is a list of cases. Each starts with a `<lang> | <input>` line and
 * holds one indented `<key>: <value>` line per output. Lines starting with `#`
 * and blank lines are comments and survive an update; a case added without
 * values is filled in by the next one.
 */

using Values = std::vector<std::pair<std::string, std::string>>;

struct Case {
    std::string lang;
    std::string input;
    Values values;
    // Comment lines just above the case.
    std::vector<std::string> comments;
};

std::vector<Case> read(const std::string &path);

/**
 * Compares what `produce` returns for each case, in order, with the file.
 * With RNE_UPDATE_SNAPSHOTS=1 it rewrites the file instead, and passes.
 */
void verify(const std::string &path, const std::function<std::vector<Values>(const std::vector<Case> &)> &produce);

} // namespace rnexecutorch::tests::snapshots
