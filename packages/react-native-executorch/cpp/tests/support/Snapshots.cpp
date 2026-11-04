#include "support/Snapshots.h"

#include <cstdlib>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string_view>

#include <gtest/gtest.h>

namespace rnexecutorch::tests::snapshots {
namespace {

constexpr std::string_view kCaseSeparator = " | ";
constexpr std::string_view kValueIndent = "  ";
constexpr std::string_view kValueSeparator = ": ";

bool updating() {
    const char *flag = std::getenv("RNE_UPDATE_SNAPSHOTS");
    return flag != nullptr && std::string_view(flag) == "1";
}

void write(const std::string &path, const std::vector<Case> &cases, const std::vector<std::string> &trailing) {
    std::ofstream out(path);
    for (const auto &c : cases) {
        for (const auto &comment : c.comments) {
            out << comment << '\n';
        }
        out << c.lang << kCaseSeparator << c.input << '\n';
        for (const auto &[key, value] : c.values) {
            out << kValueIndent << key << kValueSeparator << value << '\n';
        }
    }
    for (const auto &comment : trailing) {
        out << comment << '\n';
    }
}

// The cases, plus the comment lines after the last one.
std::pair<std::vector<Case>, std::vector<std::string>> parse(const std::string &path) {
    std::ifstream in(path);
    if (!in) {
        throw std::runtime_error("cannot open snapshot file " + path);
    }
    std::vector<Case> cases;
    std::vector<std::string> comments;
    std::string line;
    while (std::getline(in, line)) {
        if (line.empty() || line.starts_with('#')) {
            comments.push_back(line);
        } else if (line.starts_with(kValueIndent)) {
            auto separator = line.find(kValueSeparator);
            if (cases.empty() || separator == std::string::npos) {
                throw std::runtime_error("malformed snapshot line in " + path + ": " + line);
            }
            cases.back().values.emplace_back(line.substr(kValueIndent.size(), separator - kValueIndent.size()),
                                             line.substr(separator + kValueSeparator.size()));
        } else {
            auto separator = line.find(kCaseSeparator);
            if (separator == std::string::npos) {
                throw std::runtime_error("malformed snapshot line in " + path + ": " + line);
            }
            cases.push_back({.lang = line.substr(0, separator),
                             .input = line.substr(separator + kCaseSeparator.size()),
                             .values = {},
                             .comments = std::move(comments)});
            comments.clear();
        }
    }
    return {std::move(cases), std::move(comments)};
}

} // namespace

std::vector<Case> read(const std::string &path) { return parse(path).first; }

void verify(const std::string &path, const std::function<std::vector<Values>(const std::vector<Case> &)> &produce) {
    auto [cases, trailing] = parse(path);
    auto actual = produce(cases);
    ASSERT_EQ(actual.size(), cases.size());

    if (updating()) {
        for (size_t i = 0; i < cases.size(); ++i) {
            cases[i].values = std::move(actual[i]);
        }
        write(path, cases, trailing);
        return;
    }

    for (size_t i = 0; i < cases.size(); ++i) {
        if (cases[i].values != actual[i]) {
            std::ostringstream message;
            message << "snapshot of [" << cases[i].lang << "] " << cases[i].input << " changed\n";
            for (const auto &[key, value] : cases[i].values) {
                message << "  - " << key << kValueSeparator << value << '\n';
            }
            for (const auto &[key, value] : actual[i]) {
                message << "  + " << key << kValueSeparator << value << '\n';
            }
            message << "Accept with RNE_UPDATE_SNAPSHOTS=1 scripts/run-native-tests.sh, then review the diff of "
                    << path;
            ADD_FAILURE() << message.str();
        }
    }
}

} // namespace rnexecutorch::tests::snapshots
