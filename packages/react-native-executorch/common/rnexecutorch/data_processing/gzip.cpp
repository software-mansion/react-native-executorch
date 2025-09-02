#include <vector>
#include <zlib.h>

#include "gzip.h"

namespace rnexecutorch::gzip {

std::string deflate(const std::string &input) {
  z_stream strm{};
  if (deflateInit2(&strm,
                   Z_DEFAULT_COMPRESSION,
                   Z_DEFLATED,
                   15 + 16,
                   8,
                   Z_DEFAULT_STRATEGY) != Z_OK) {
    throw std::runtime_error("deflateInit2 failed");
  }

  std::string out;
  out.reserve(input.size() / 2 + 20);

  strm.next_in = reinterpret_cast<Bytef *>(const_cast<char *>(input.data()));
  strm.avail_in = static_cast<uInt>(input.size());

  std::vector<unsigned char> buf(16384);
  int ret;
  do {
    strm.next_out = buf.data();
    strm.avail_out = static_cast<uInt>(buf.size());

    ret = deflate(&strm, strm.avail_in ? Z_NO_FLUSH : Z_FINISH);
    if (ret == Z_STREAM_ERROR) {
      deflateEnd(&strm);
      throw std::runtime_error("deflate stream error");
    }

    std::size_t have = buf.size() - strm.avail_out;
    out.append(reinterpret_cast<char *>(buf.data()), have);
  } while (ret != Z_STREAM_END);

  deflateEnd(&strm);
  return out;
}

} // namespace rnexecutorch::gzip
