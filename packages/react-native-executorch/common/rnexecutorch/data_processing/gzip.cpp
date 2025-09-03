#include <vector>
#include <zlib.h>

#include "gzip.h"

namespace rnexecutorch::gzip {

namespace {
constexpr int32_t kGzipWrapper = 16;     // gzip header/trailer
constexpr int32_t kMemLevel = 8;         // memory level
constexpr size_t kChunkSize = 16 * 1024; // 16 KiB stream buffer
constexpr size_t kReservePad = 20;       // gzip header + trailer
} // namespace

std::string deflate(const std::string &input) {
  z_stream strm{};
  if (::deflateInit2(&strm, Z_DEFAULT_COMPRESSION, Z_DEFLATED,
                     MAX_WBITS + kGzipWrapper, kMemLevel,
                     Z_DEFAULT_STRATEGY) != Z_OK) {
    throw std::runtime_error("deflateInit2 failed");
  }

  std::string out;
  out.reserve(input.size() / 2 + kReservePad);

  strm.next_in = reinterpret_cast<z_const Bytef *>(
      const_cast<z_const char *>(input.data()));
  strm.avail_in = static_cast<uInt>(input.size());

  std::vector<unsigned char> buf(kChunkSize);
  int ret;
  do {
    strm.next_out = buf.data();
    strm.avail_out = static_cast<uInt>(buf.size());

    ret = ::deflate(&strm, strm.avail_in ? Z_NO_FLUSH : Z_FINISH);
    if (ret == Z_STREAM_ERROR) {
      ::deflateEnd(&strm);
      throw std::runtime_error("deflate stream error");
    }

    std::size_t have = buf.size() - strm.avail_out;
    out.append(reinterpret_cast<char *>(buf.data()), have);
  } while (ret != Z_STREAM_END);

  ::deflateEnd(&strm);
  return out;
}

} // namespace rnexecutorch::gzip
