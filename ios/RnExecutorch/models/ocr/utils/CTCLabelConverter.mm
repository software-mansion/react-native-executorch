#import "CTCLabelConverter.h"

@implementation CTCLabelConverter

- (instancetype)initWithCharacters:(NSString *)characters separatorList:(NSDictionary *)separatorList dictPathList:(NSDictionary *)dictPathList {
  self = [super init];
  if (self) {
    _dict = [NSMutableDictionary dictionary];
    NSMutableArray *mutableCharacters = [NSMutableArray arrayWithObject:@"[blank]"];
    
    for (NSUInteger i = 0; i < [characters length]; i++) {
      NSString *charStr = [NSString stringWithFormat:@"%C", [characters characterAtIndex:i]];
      [mutableCharacters addObject:charStr];
      self.dict[charStr] = @(i + 1);
    }
    
    _character = [mutableCharacters copy];
    _separatorList = separatorList;
    
    NSMutableArray *ignoreIndexes = [NSMutableArray arrayWithObject:@(0)];
    for (NSString *sep in separatorList.allValues) {
      NSUInteger index = [characters rangeOfString:sep].location;
      if (index != NSNotFound) {
        [ignoreIndexes addObject:@(index)];
      }
    }
    _ignoreIdx = [ignoreIndexes copy];
    _dictList = [NSDictionary dictionary];
    [self loadDictionariesWithDictPathList:dictPathList];
  }
  return self;
}

- (void)loadDictionariesWithDictPathList:(NSDictionary<NSString *, NSString *> *)dictPathList {
  NSMutableDictionary *tempDictList = [NSMutableDictionary dictionary];
  for (NSString *lang in dictPathList.allKeys) {
    NSString *dictPath = dictPathList[lang];
    NSError *error;
    NSString *fileContents = [NSString stringWithContentsOfFile:dictPath encoding:NSUTF8StringEncoding error:&error];
    if (error) {
      NSLog(@"Error reading file: %@", error.localizedDescription);
      continue;
    }
    NSArray *lines = [fileContents componentsSeparatedByCharactersInSet:[NSCharacterSet newlineCharacterSet]];
    [tempDictList setObject:lines forKey:lang];
  }
  _dictList = [tempDictList copy];
}

- (NSArray<NSString *> *)decodeGreedy:(NSArray<NSNumber *> *)textIndex length:(NSInteger)length {
  NSMutableArray<NSString *> *texts = [NSMutableArray array];
  NSUInteger index = 0;
  
  while (index < textIndex.count) {
    NSUInteger segmentLength = MIN(length, textIndex.count - index);
    NSRange range = NSMakeRange(index, segmentLength);
    NSArray<NSNumber *> *subArray = [textIndex subarrayWithRange:range];
    
    NSMutableString *text = [NSMutableString string];
    NSNumber *lastChar = nil;
    
    NSMutableArray<NSNumber *> *isNotRepeated = [NSMutableArray arrayWithObject:@YES];
    NSMutableArray<NSNumber *> *isNotIgnored = [NSMutableArray array];
    
    for (NSUInteger i = 0; i < subArray.count; i++) {
      NSNumber *currentChar = subArray[i];
      if (i > 0) {
        [isNotRepeated addObject:@(![lastChar isEqualToNumber:currentChar])];
      }
      [isNotIgnored addObject:@(![self.ignoreIdx containsObject:currentChar])];
      
      lastChar = currentChar;
    }
    
    for (NSUInteger j = 0; j < subArray.count; j++) {
      if ([isNotRepeated[j] boolValue] && [isNotIgnored[j] boolValue]) {
        NSUInteger charIndex = [subArray[j] unsignedIntegerValue];
        [text appendString:self.character[charIndex]];
      }
    }
    
    [texts addObject:text.copy];
    index += segmentLength;
    
    if (segmentLength < length) {
      break;
    }
  }
  
  return texts.copy;
}

@end
