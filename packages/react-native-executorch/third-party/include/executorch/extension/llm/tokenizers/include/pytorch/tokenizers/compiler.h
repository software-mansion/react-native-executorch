/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @lint-ignore-every LICENSELINT

#pragma once

/**
 * @file
 * Compiler and platform-specific declarations.
 */

#ifdef _WIN32
#include <BaseTsd.h>
// ssize_t isn't available on Windows. Alias it to the Windows SSIZE_T value.
typedef SSIZE_T ssize_t;
#endif
