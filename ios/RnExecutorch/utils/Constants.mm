#import "Constants.h"
#import <string>
#import "ConversationManager.h"

NSString * const END_OF_TEXT_TOKEN_NS = [[NSString alloc] initWithBytes:END_OF_TEXT_TOKEN.data()
                                                                 length:END_OF_TEXT_TOKEN.size()
                                                               encoding:NSUTF8StringEncoding];

NSString * const BEGIN_OF_TEXT_TOKEN_NS = [[NSString alloc] initWithBytes:BEGIN_OF_TEXT_TOKEN.data()
                                                                 length:BEGIN_OF_TEXT_TOKEN.size()
                                                               encoding:NSUTF8StringEncoding];

NSString * const START_HEADER_ID_TOKEN_NS = [[NSString alloc] initWithBytes:START_HEADER_ID_TOKEN.data()
                                                                 length:START_HEADER_ID_TOKEN.size()
                                                               encoding:NSUTF8StringEncoding];


NSString * const END_HEADER_ID_TOKEN_NS = [[NSString alloc] initWithBytes:END_HEADER_ID_TOKEN.data()
                                                                 length:END_HEADER_ID_TOKEN.size()
                                                               encoding:NSUTF8StringEncoding];
