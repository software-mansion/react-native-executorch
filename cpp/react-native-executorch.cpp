#include "react-native-executorch.h"
#include "MathLibrary.h"

namespace RnExecutorch2 {
	double multiply(double a, double b) {
		return MathLibrary::Arithmetic::Multiply(a, b);
	}
}
