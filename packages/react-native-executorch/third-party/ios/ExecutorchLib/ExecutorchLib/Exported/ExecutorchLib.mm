// ExecutorchLib exists to package the ExecuTorch runtime static libraries into a
// single framework: the payload comes from the -force_load entries in
// OTHER_LDFLAGS, not from code compiled here. This translation unit only gives
// the framework target something to compile.
//
// The Objective-C wrapper this target used to hold (ETModel) belonged to the
// pre-rewrite API and was removed in #1255; the project kept referencing it,
// which left the framework unbuildable.
//
// It is Objective-C++ on purpose: the ExecuTorch runtime is C++, so the target
// needs at least one C++ translation unit for the C++ standard library to be
// linked into the framework.
