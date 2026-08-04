#include <cstdint>
#include <limits>
#include <string>
#include <vector>

#include "support/JsiTestEnv.h"

#include "core/conversions.h"

namespace rnexecutorch::tests {
namespace {

namespace conversions = rnexecutorch::core::conversions;
namespace jsi = facebook::jsi;
using ::testing::HasSubstr;

using ConversionsTest = JsiTestEnv;

// conversions:: is the argument-parsing layer every JSI entry point funnels
// through, so its range and type checks are what stop a bad JS call from
// reaching a reinterpret_cast. Tested against real jsi::Values.

jsi::Value number(jsi::Runtime &rt, double v) {
    return jsi::Value(v);
}

TEST_F(ConversionsTest, AcceptsWellTypedScalars) {
    EXPECT_EQ(conversions::asType<double>(rt(), "ctx", number(rt(), 1.5)), 1.5);
    EXPECT_EQ(conversions::asType<int32_t>(rt(), "ctx", number(rt(), -7)), -7);
    EXPECT_EQ(conversions::asType<uint64_t>(rt(), "ctx", number(rt(), 42)), 42u);
    EXPECT_EQ(conversions::asType<uint8_t>(rt(), "ctx", number(rt(), 255)), 255);
    EXPECT_EQ(conversions::asType<bool>(rt(), "ctx", jsi::Value(true)), true);
    EXPECT_EQ(conversions::asType<std::string>(rt(), "ctx", jsi::Value(jsi::String::createFromUtf8(rt(), "hi"))), "hi");
}

TEST_F(ConversionsTest, RejectsWrongJsType) {
    // The message must name the parameter so a JS-side error points at the
    // offending argument rather than "something went wrong".
    try {
        conversions::asType<double>(rt(), "sigmoid: src", jsi::Value(true));
        FAIL() << "expected a JSError";
    } catch (const jsi::JSError &e) {
        EXPECT_THAT(e.getMessage(), HasSubstr("sigmoid: src"));
        EXPECT_THAT(e.getMessage(), HasSubstr("must be a number"));
    }

    EXPECT_THROW(conversions::asType<bool>(rt(), "ctx", number(rt(), 1)), jsi::JSError);
    EXPECT_THROW(conversions::asType<std::string>(rt(), "ctx", number(rt(), 1)), jsi::JSError);
}

TEST_F(ConversionsTest, RejectsNonIntegralValuesForIntegerTypes) {
    EXPECT_THROW(conversions::asType<int32_t>(rt(), "ctx", number(rt(), 1.5)), jsi::JSError);
    EXPECT_THROW(conversions::asType<uint64_t>(rt(), "ctx", number(rt(), 1.5)), jsi::JSError);
    EXPECT_THROW(conversions::asType<uint8_t>(rt(), "ctx", number(rt(), 0.5)), jsi::JSError);
}

TEST_F(ConversionsTest, RejectsNaNAndInfinity) {
    const double nan = std::numeric_limits<double>::quiet_NaN();
    const double inf = std::numeric_limits<double>::infinity();

    EXPECT_THROW(conversions::asType<int32_t>(rt(), "ctx", number(rt(), nan)), jsi::JSError);
    EXPECT_THROW(conversions::asType<int32_t>(rt(), "ctx", number(rt(), inf)), jsi::JSError);
    EXPECT_THROW(conversions::asType<uint64_t>(rt(), "ctx", number(rt(), -inf)), jsi::JSError);
}

TEST_F(ConversionsTest, RejectsOutOfRangeIntegers) {
    // JS numbers are doubles, so a caller can easily hand over a value that does
    // not fit the native type — that must be rejected, not truncated.
    EXPECT_THROW(conversions::asType<int32_t>(rt(), "ctx", number(rt(), 2147483648.0)), jsi::JSError);
    EXPECT_THROW(conversions::asType<int32_t>(rt(), "ctx", number(rt(), -2147483649.0)), jsi::JSError);
    EXPECT_THROW(conversions::asType<uint8_t>(rt(), "ctx", number(rt(), 256)), jsi::JSError);
    EXPECT_THROW(conversions::asType<uint8_t>(rt(), "ctx", number(rt(), -1)), jsi::JSError);
    EXPECT_THROW(conversions::asType<uint64_t>(rt(), "ctx", number(rt(), -1)), jsi::JSError);

    // Boundaries themselves stay valid.
    EXPECT_EQ(conversions::asType<int32_t>(rt(), "ctx", number(rt(), 2147483647.0)), 2147483647);
    EXPECT_EQ(conversions::asType<int32_t>(rt(), "ctx", number(rt(), -2147483648.0)),
              std::numeric_limits<int32_t>::min());
    EXPECT_EQ(conversions::asType<uint8_t>(rt(), "ctx", number(rt(), 0)), 0);
}

TEST_F(ConversionsTest, AsVectorConvertsElementwiseAndNamesTheBadIndex) {
    auto array = eval("return [1, 2, 3];");
    EXPECT_EQ(conversions::asVector<int32_t>(rt(), "shape", array), (std::vector<int32_t>{1, 2, 3}));

    auto mixed = eval("return [1, 'two', 3];");
    try {
        conversions::asVector<int32_t>(rt(), "shape", mixed);
        FAIL() << "expected a JSError";
    } catch (const jsi::JSError &e) {
        EXPECT_THAT(e.getMessage(), HasSubstr("shape[1]"));
    }
}

TEST_F(ConversionsTest, AsVectorRejectsNonArrays) {
    EXPECT_THROW(conversions::asVector<int32_t>(rt(), "shape", eval("return {};")), jsi::JSError);
    // A TypedArray is not a JS Array — asVector is the boxed path and must say so.
    EXPECT_THROW(conversions::asVector<int32_t>(rt(), "shape", eval("return new Int32Array(3);")), jsi::JSError);
}

TEST_F(ConversionsTest, RequiredPropertyIsEnforced) {
    auto object = eval("return { a: 1 };").getObject(rt());
    EXPECT_EQ(conversions::getRequiredProperty<int32_t>(rt(), "opts", object, "a"), 1);

    try {
        conversions::getRequiredProperty<int32_t>(rt(), "opts", object, "b");
        FAIL() << "expected a JSError";
    } catch (const jsi::JSError &e) {
        EXPECT_THAT(e.getMessage(), HasSubstr("option 'b' is required"));
    }
}

TEST_F(ConversionsTest, OptionalPropertyTreatsNullAndUndefinedAsAbsent) {
    auto object = eval("return { a: 1, b: null, c: undefined };").getObject(rt());

    EXPECT_EQ(conversions::getOptionalProperty<int32_t>(rt(), "opts", object, "a").value_or(-1), 1);
    EXPECT_FALSE(conversions::getOptionalProperty<int32_t>(rt(), "opts", object, "b").has_value());
    EXPECT_FALSE(conversions::getOptionalProperty<int32_t>(rt(), "opts", object, "c").has_value());
    EXPECT_FALSE(conversions::getOptionalProperty<int32_t>(rt(), "opts", object, "missing").has_value());
}

TEST_F(ConversionsTest, OptionalPropertyStillTypeChecksWhenPresent) {
    auto object = eval("return { a: 'not a number' };").getObject(rt());
    EXPECT_THROW(conversions::getOptionalProperty<int32_t>(rt(), "opts", object, "a"), jsi::JSError);
}

TEST_F(ConversionsTest, TypedArrayRoundTrips) {
    const std::vector<int32_t> source{1, -2, 3, -4};
    auto typedArray = conversions::toJsiTypedArray(rt(), source);

    // Comes back as the matching JS view, not a plain Array.
    rt().global().setProperty(rt(), "roundTripped", typedArray);
    EXPECT_EQ(evalString("return roundTripped.constructor.name;"), "Int32Array");
    EXPECT_EQ(evalNumber("return roundTripped.length;"), 4);

    auto readBack = conversions::fromJsiTypedArray<int32_t>(
        rt(), "ctx", jsi::Value(rt(), rt().global().getProperty(rt(), "roundTripped")));
    EXPECT_EQ(readBack, source);
}

TEST_F(ConversionsTest, TypedArrayReadHonoursViewWindow) {
    // fromJsiTypedArray must respect byteOffset/byteLength, so a subarray view
    // yields only its own window rather than the whole backing buffer.
    auto view = eval("return new Int32Array([1, 2, 3, 4, 5]).subarray(1, 4);");
    EXPECT_EQ(conversions::fromJsiTypedArray<int32_t>(rt(), "ctx", view),
              (std::vector<int32_t>{2, 3, 4}));
}

TEST_F(ConversionsTest, TypedArrayReadRejectsMisalignedLength) {
    // 3 bytes cannot be read as int32_t elements.
    auto view = eval("return new Uint8Array([1, 2, 3]);");
    EXPECT_THROW(conversions::fromJsiTypedArray<int32_t>(rt(), "ctx", view), jsi::JSError);
}

TEST_F(ConversionsTest, EmptyTypedArrayRoundTrips) {
    auto empty = conversions::toJsiTypedArray(rt(), std::vector<float>{});
    rt().global().setProperty(rt(), "emptyArray", empty);
    EXPECT_EQ(evalNumber("return emptyArray.length;"), 0);
}

TEST_F(ConversionsTest, ToJsiArrayHandlesStringsAndNumbers) {
    auto numbers = conversions::toJsiArray(rt(), std::vector<int32_t>{1, 2, 3});
    rt().global().setProperty(rt(), "numbers", numbers);
    EXPECT_TRUE(evalBool("return Array.isArray(numbers);"));
    EXPECT_EQ(evalNumber("return numbers[2];"), 3);

    auto strings = conversions::toJsiArray(rt(), std::vector<std::string>{"a", "b"});
    rt().global().setProperty(rt(), "strings", strings);
    EXPECT_EQ(evalString("return strings.join('');"), "ab");
}

} // namespace
} // namespace rnexecutorch::tests
