#import "HuggingFaceTokenizer.h"
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <tokenizers-cpp/tokenizers_cpp.h>

std::string loadBytesFromFile(const std::string &path) {
  std::ifstream fs(path, std::ios::in | std::ios::binary);
  if (fs.fail()) {
    throw std::runtime_error("Failed to open tokenizer file");
  }
  std::string data;
  fs.seekg(0, std::ios::end);
  size_t size = static_cast<size_t>(fs.tellg());
  fs.seekg(0, std::ios::beg);
  data.resize(size);
  fs.read(data.data(), size);
  return data;
}

@implementation HuggingFaceTokenizer {
  std::unique_ptr<tokenizers::Tokenizer> _tokenizer;
}

- (instancetype)initWithTokenizerPath:(NSString *)tokenizerPath {
  self = [super init];
  if (self) {
    auto blob = loadBytesFromFile([tokenizerPath UTF8String]);
    _tokenizer = tokenizers::Tokenizer::FromBlobJSON(blob);
  }
  return self;
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
  return [self decode:tokenIds skipSpecialTokens:NO];
}

- (NSString *)decode:(NSArray<NSNumber *> *)tokenIds
    skipSpecialTokens:(BOOL)skipSpecialTokens {
  std::vector<int32_t> stdTokenIds;
  stdTokenIds.reserve([tokenIds count]);
  for (NSNumber *tokenId in tokenIds) {
    stdTokenIds.push_back([tokenId intValue]);
  }
  std::string decodedString =
      _tokenizer->Decode(stdTokenIds, skipSpecialTokens);
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
