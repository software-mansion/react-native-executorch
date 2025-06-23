#include <vector>

std::vector<double> softmax(const std::vector<double> &v);
void normalize(std::vector<float> &v);
std::vector<float> meanPooling(std::vector<float> &modelOutput,
                               std::vector<float> &attnMask);
