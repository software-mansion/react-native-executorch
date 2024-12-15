#include "Utils.h"
#include <vector>
#include <cmath>

std::vector<double> softmax(const std::vector<double>& v) {
    std::vector<double> result(v.size());
    double maxVal = *std::max_element(v.begin(), v.end());

    double sumExp = 0.0;
    for (size_t i = 0; i < v.size(); ++i) {
        result[i] = std::exp(v[i] - maxVal);
        sumExp += result[i];
    }

    for (size_t i = 0; i < v.size(); ++i) {
        result[i] /= sumExp;
    }

    return result;
}