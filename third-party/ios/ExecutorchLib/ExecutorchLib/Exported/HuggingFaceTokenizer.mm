#import "HuggingFaceTokenizer.h"
#include <fstream>
#include <iostream>
#include <string>
#include <tokenizers-cpp/tokenizers_cpp.h>

@implementation HuggingFaceTokenizer {
  std::unique_ptr<tokenizers::Tokenizer> _tokenizer;
}

std::string LoadBytesFromFile(const std::string &path) {
  std::ifstream fs(path, std::ios::in | std::ios::binary);
  if (fs.fail()) {
    exit(1);
  }
  std::string data;
  fs.seekg(0, std::ios::end);
  size_t size = static_cast<size_t>(fs.tellg());
  fs.seekg(0, std::ios::beg);
  data.resize(size);
  fs.read(data.data(), size);
  return data;
}

- (NSNumber *)loadTokenizer:(NSString *)jsonPath {
  try {
    auto blob = LoadBytesFromFile([jsonPath UTF8String]);
    _tokenizer = tokenizers::Tokenizer::FromBlobJSON(blob);
  } catch (const std::exception &e) {
    return @1;
  }

  return @0;
}

- (NSArray<NSNumber *> *)encode:(NSString *)text {
  std::vector<int32_t> result = _tokenizer->Encode([text UTF8String]);
  NSMutableArray<NSNumber *> *encodedResult =
      [[NSMutableArray alloc] initWithCapacity:result.size()];
  for (int32_t tokenId : result) {
    [encodedResult addObject:@(tokenId)];
  }
  return encodedResult;
}

- (NSString *)decode:(NSArray<NSNumber *> *)tokenIds {
  std::vector<int32_t> stdTokenIds;
  stdTokenIds.reserve([tokenIds count]);
  for (NSNumber *tokenId in tokenIds) {
    stdTokenIds.push_back([tokenId intValue]);
  }
  std::string decodedString = _tokenizer->Decode(stdTokenIds);
  return [NSString stringWithUTF8String:decodedString.c_str()];
}

- (NSUInteger)getVocabSize {
  return (NSUInteger)_tokenizer->GetVocabSize();
}

- (NSString *)idToToken:(NSInteger)tokenId {
  std::string token = _tokenizer->IdToToken(static_cast<int32_t>(tokenId));
  return [NSString stringWithUTF8String:token.c_str()];
}

- (NSInteger)tokenToId:(NSString *)token {
  std::string stdToken = [token UTF8String];
  return (NSInteger)_tokenizer->TokenToId(stdToken);
}

- (void)dealloc {
  _tokenizer.reset();
}

@end
