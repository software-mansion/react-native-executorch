#import <Foundation/Foundation.h>
#import <string>
#import <string_view>
#import <deque>

enum class ChatRole {
    SYSTEM,
    USER,
    ASSISTANT
};

inline constexpr std::string_view BEGIN_OF_TEXT_TOKEN = "<|begin_of_text|>";
inline constexpr std::string_view END_OF_TEXT_TOKEN = "<|eot_id|>";
inline constexpr std::string_view START_HEADER_ID_TOKEN = "<|start_header_id|>";
inline constexpr std::string_view END_HEADER_ID_TOKEN = "<|end_header_id|>";

@interface ConversationManager : NSObject {
    NSUInteger numMessagesContextWindow;
    std::string basePrompt;
    std::deque<std::string> messages;
}

- (instancetype)initWithNumMessagesContextWindow:(NSUInteger)numMessages
                                     systemPrompt:(NSString *)systemPrompt;

- (void)addResponse:(NSString *)text senderRole:(ChatRole)senderRole;
- (NSString *)getConversation;

@end
